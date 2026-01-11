# S2 .NET SDK - Plano de Implementação

## Visão Geral

SDK .NET idiomático para [S2.dev](https://s2.dev) - a plataforma de streaming de dados.

**Objetivo:** Paridade de features com o [SDK TypeScript](https://github.com/s2-streamstore/s2-sdk-typescript), seguindo convenções .NET.

**Target:** .NET 8+ (LTS) com suporte a .NET Standard 2.1 para compatibilidade ampla.

---

## 1. Arquitetura Proposta

```
S2.StreamStore/
├── src/
│   ├── S2.StreamStore/              # Biblioteca principal
│   │   ├── S2Client.cs              # Entry point
│   │   ├── Basin.cs                 # Operações de basin
│   │   ├── Stream.cs                # Operações de stream
│   │   ├── Sessions/
│   │   │   ├── AppendSession.cs     # Escrita com pipelining
│   │   │   └── ReadSession.cs       # Leitura com IAsyncEnumerable
│   │   ├── Models/
│   │   │   ├── Record.cs
│   │   │   ├── StreamInfo.cs
│   │   │   └── BasinInfo.cs
│   │   ├── Auth/
│   │   │   └── TokenProvider.cs
│   │   └── Http/
│   │       ├── S2HttpClient.cs      # HTTP/2 com retry/backoff
│   │       └── StreamingClient.cs   # SSE/streaming support
│   │
│   └── S2.StreamStore.Extensions/   # Opcional: integração DI
│       └── ServiceCollectionExtensions.cs
│
├── tests/
│   ├── S2.StreamStore.Tests/        # Unit tests
│   └── S2.StreamStore.IntegrationTests/
│
├── samples/
│   ├── BasicUsage/
│   ├── GameStateStreaming/
│   └── AgentSessions/
│
└── docs/
    └── README.md
```

---

## 2. API Design

### 2.1 Uso Básico

```csharp
// Criar cliente
var s2 = new S2Client(new S2Options
{
    AccessToken = "s2_token_...",
    Region = S2Region.AWS  // default
});

// Navegação: Client -> Basin -> Stream
var basin = s2.Basin("my-basin");
var stream = basin.Stream("my-stream");

// Operações básicas
await stream.CreateAsync();
await stream.AppendAsync(new { message = "hello", timestamp = DateTime.UtcNow });
var info = await stream.GetInfoAsync();
await stream.DeleteAsync();
```

### 2.2 AppendSession (Pipelining)

```csharp
// Sessão de escrita com batching automático
await using var session = await stream.OpenAppendSessionAsync(new AppendSessionOptions
{
    BatchSize = 100,           // Records por batch
    BatchTimeout = TimeSpan.FromMilliseconds(50),  // Flush timeout
    MaxConcurrentBatches = 4   // Pipelining
});

// Fire-and-forget appends (buffered)
for (int i = 0; i < 10000; i++)
{
    await session.AppendAsync(new GameEvent { Tick = i, Data = "..." });
}

// Aguardar confirmação de todos
await session.FlushAsync();

// Ou append com confirmação individual
var receipt = await session.AppendAsync(data, waitForAck: true);
Console.WriteLine($"Sequence: {receipt.SequenceNumber}");
```

### 2.3 ReadSession (IAsyncEnumerable)

```csharp
// Leitura com IAsyncEnumerable - idiomático .NET
var session = await stream.OpenReadSessionAsync(new ReadSessionOptions
{
    Start = ReadStart.FromTail(offset: 1),  // Último record
    // ou: Start = ReadStart.FromSequence(12345),
    // ou: Start = ReadStart.FromTimestamp(DateTime.UtcNow.AddHours(-1))
});

await foreach (var record in session)
{
    var gameState = record.Deserialize<GameState>();
    Console.WriteLine($"Tick {gameState.Tick} at seq {record.SequenceNumber}");
}

// Com CancellationToken
await foreach (var record in session.WithCancellation(cts.Token))
{
    // ...
}
```

### 2.4 Tipagem Forte (Generics)

```csharp
// Stream tipado
var stream = basin.Stream<GameState>("game-state");

await stream.AppendAsync(new GameState { Tick = 1, Players = [...] });

await foreach (var record in stream.ReadAsync())
{
    GameState state = record.Value;  // Já deserializado
}
```

### 2.5 Access Tokens API

```csharp
// Criar token com escopo limitado (para frontend)
var token = await s2.CreateAccessTokenAsync(new AccessTokenRequest
{
    Basins = new ScopeFilter { Exact = "my-basin" },
    Streams = new ScopeFilter { Prefix = "player-" },
    Operations = [S2Operation.Read],
    ExpiresAt = DateTime.UtcNow.AddHours(24)
});

Console.WriteLine($"Token: {token.AccessToken}");
Console.WriteLine($"Expires: {token.ExpiresAt}");
```

---

## 3. Features por Fase

### Fase 1: Core (MVP) - ~1 semana

- [ ] **S2Client** - Configuração e autenticação
- [ ] **Basin** - CRUD de basins
- [ ] **Stream** - CRUD de streams
- [ ] **Append simples** - POST individual
- [ ] **Read simples** - GET com polling
- [ ] **Serialização** - System.Text.Json com opções customizáveis
- [ ] **Retry/Backoff** - Polly ou implementação própria
- [ ] **Testes unitários** básicos

### Fase 2: Sessions - ~1 semana

- [ ] **ReadSession** - SSE streaming com IAsyncEnumerable
- [ ] **AppendSession** - Batching e pipelining
- [ ] **Backpressure** - Channel<T> bounded para controle de memória
- [ ] **Graceful shutdown** - IAsyncDisposable
- [ ] **Reconnection** automática

### Fase 3: Polish - ~3-5 dias

- [ ] **Access Tokens API** - Criar/revogar tokens
- [ ] **Logging** - ILogger integration
- [ ] **Métricas** - EventCounters / Meters
- [ ] **DI Extensions** - `services.AddS2Client()`
- [ ] **Source Generator** - AOT-friendly serialization (opcional)
- [ ] **Documentação** - XML docs + README completo

### Fase 4: Extras - Ongoing

- [ ] **Trimming support** - AOT/NativeAOT ready
- [ ] **OpenTelemetry** - Tracing integration
- [ ] **Health checks** - ASP.NET Core health checks
- [ ] **Benchmarks** - BenchmarkDotNet

---

## 4. Detalhes Técnicos

### 4.1 HTTP/2 Streaming

```csharp
// Usar HttpClient com HTTP/2 para SSE
public class StreamingClient
{
    private readonly HttpClient _client;

    public StreamingClient()
    {
        _client = new HttpClient(new SocketsHttpHandler
        {
            EnableMultipleHttp2Connections = true,
            KeepAlivePingPolicy = HttpKeepAlivePingPolicy.WithActiveRequests,
            KeepAlivePingTimeout = TimeSpan.FromSeconds(30),
            KeepAlivePingDelay = TimeSpan.FromSeconds(60)
        })
        {
            DefaultRequestVersion = HttpVersion.Version20,
            DefaultVersionPolicy = HttpVersionPolicy.RequestVersionOrHigher
        };
    }

    public async IAsyncEnumerable<ServerSentEvent> ReadSseAsync(
        string url,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Accept.Add(new("text/event-stream"));

        using var response = await _client.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            ct);

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);

        var eventBuilder = new SseEventBuilder();

        while (!reader.EndOfStream && !ct.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(ct);

            if (eventBuilder.TryAddLine(line, out var evt))
            {
                yield return evt;
            }
        }
    }
}
```

### 4.2 AppendSession com Pipelining

```csharp
public sealed class AppendSession : IAsyncDisposable
{
    private readonly Channel<PendingAppend> _queue;
    private readonly Task _writerTask;
    private readonly SemaphoreSlim _pipelineSemaphore;

    public AppendSession(Stream stream, AppendSessionOptions options)
    {
        _queue = Channel.CreateBounded<PendingAppend>(new BoundedChannelOptions(options.BufferSize)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });

        _pipelineSemaphore = new SemaphoreSlim(options.MaxConcurrentBatches);
        _writerTask = RunWriterLoopAsync();
    }

    public ValueTask<AppendReceipt> AppendAsync<T>(T data, CancellationToken ct = default)
    {
        var pending = new PendingAppend(data);

        // Non-blocking if buffer has space
        if (_queue.Writer.TryWrite(pending))
            return new ValueTask<AppendReceipt>(pending.Task);

        // Async wait for space
        return AppendSlowPathAsync(pending, ct);
    }

    private async Task RunWriterLoopAsync()
    {
        var batch = new List<PendingAppend>();
        var batchTimer = new PeriodicTimer(_options.BatchTimeout);

        try
        {
            while (await _queue.Reader.WaitToReadAsync())
            {
                // Collect batch
                while (batch.Count < _options.BatchSize &&
                       _queue.Reader.TryRead(out var item))
                {
                    batch.Add(item);
                }

                if (batch.Count > 0)
                {
                    // Pipelining: don't wait for previous batch
                    await _pipelineSemaphore.WaitAsync();
                    _ = SendBatchAsync(batch.ToList());
                    batch.Clear();
                }
            }
        }
        finally
        {
            // Flush remaining
            if (batch.Count > 0)
                await SendBatchAsync(batch);
        }
    }

    private async Task SendBatchAsync(List<PendingAppend> batch)
    {
        try
        {
            var response = await _httpClient.PostAsync(...);
            var result = await response.Content.ReadFromJsonAsync<AppendResponse>();

            for (int i = 0; i < batch.Count; i++)
            {
                batch[i].SetResult(new AppendReceipt(result.StartSequence + i));
            }
        }
        catch (Exception ex)
        {
            foreach (var item in batch)
                item.SetException(ex);
        }
        finally
        {
            _pipelineSemaphore.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        _queue.Writer.Complete();
        await _writerTask;
        _pipelineSemaphore.Dispose();
    }
}
```

### 4.3 Configuração DI

```csharp
// Extension method
public static class S2ServiceCollectionExtensions
{
    public static IServiceCollection AddS2Client(
        this IServiceCollection services,
        Action<S2Options> configure)
    {
        services.Configure(configure);
        services.AddHttpClient<S2HttpClient>();
        services.AddSingleton<S2Client>();
        return services;
    }
}

// Uso em Program.cs
builder.Services.AddS2Client(options =>
{
    options.AccessToken = builder.Configuration["S2:Token"];
    options.Basin = "my-basin";
});

// Injeção
public class GameService(S2Client s2)
{
    private readonly IStream _stream = s2.Basin("game").Stream("state");
}
```

---

## 5. Compatibilidade com SDK TypeScript

| Feature | TypeScript SDK | .NET SDK (proposto) |
|---------|---------------|---------------------|
| Basin CRUD | ✅ | ✅ |
| Stream CRUD | ✅ | ✅ |
| Append | ✅ | ✅ |
| AppendSession | ✅ | ✅ |
| ReadSession | ✅ (AsyncIterator) | ✅ (IAsyncEnumerable) |
| Access Tokens | ✅ | ✅ |
| Fencing Tokens | ✅ | ✅ Fase 2 |
| Command Records | ✅ | ✅ Fase 2 |

---

## 6. Estrutura de Arquivos Inicial

```
src/S2.StreamStore/
├── S2Client.cs
├── S2Options.cs
├── Basin.cs
├── Stream.cs
├── IStream.cs
├── Sessions/
│   ├── IAppendSession.cs
│   ├── AppendSession.cs
│   ├── AppendSessionOptions.cs
│   ├── IReadSession.cs
│   ├── ReadSession.cs
│   └── ReadSessionOptions.cs
├── Models/
│   ├── Record.cs
│   ├── AppendReceipt.cs
│   ├── StreamInfo.cs
│   ├── BasinInfo.cs
│   └── AccessToken.cs
├── Serialization/
│   ├── IRecordSerializer.cs
│   └── JsonRecordSerializer.cs
├── Http/
│   ├── S2HttpClient.cs
│   ├── S2Endpoints.cs
│   └── SseReader.cs
├── Exceptions/
│   ├── S2Exception.cs
│   ├── StreamNotFoundException.cs
│   └── RateLimitedException.cs
└── S2.StreamStore.csproj
```

---

## 7. Próximos Passos

1. **Validar com S2 team** - Compartilhar este plano para feedback
2. **Criar repositório** - `s2-streamstore/s2-dotnet` ou fork próprio
3. **Implementar MVP** - Fase 1 em ~1 semana
4. **Publicar preview** - NuGet com versão `-alpha`
5. **Iterar** - Feedback da comunidade

---

## 8. Recursos

- [S2 Docs](https://s2.dev/docs)
- [S2 TypeScript SDK](https://github.com/s2-streamstore/s2-sdk-typescript)
- [S2 API Reference](https://s2.dev/docs/api)
- [.NET HTTP/2 Guide](https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines)

---

## Contato

Interessado em contribuir?

- S2.dev Discord/Slack (se existir)
- GitHub Issues no repo do SDK TypeScript
- Email para o time S2

---

*Plano criado por: [seu nome/github]*
*Data: Janeiro 2026*
*Versão: 1.0*
