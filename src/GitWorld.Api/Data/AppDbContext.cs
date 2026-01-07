using GitWorld.Shared.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitWorld.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<Battle> Battles => Set<Battle>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<PlayerItem> PlayerItems => Set<PlayerItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Player
        modelBuilder.Entity<Player>(entity =>
        {
            entity.ToTable("players");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");

            entity.Property(e => e.GitHubId).HasColumnName("github_id").IsRequired();
            entity.HasIndex(e => e.GitHubId).IsUnique();

            entity.Property(e => e.GitHubLogin).HasColumnName("github_login").HasMaxLength(255).IsRequired();

            // Stats
            entity.Property(e => e.Hp).HasColumnName("hp");
            entity.Property(e => e.HpMax).HasColumnName("hp_max");
            entity.Property(e => e.Dano).HasColumnName("dano");
            entity.Property(e => e.VelocidadeAtaque).HasColumnName("velocidade_ataque");
            entity.Property(e => e.VelocidadeMovimento).HasColumnName("velocidade_movimento");
            entity.Property(e => e.Critico).HasColumnName("critico");
            entity.Property(e => e.Evasao).HasColumnName("evasao");
            entity.Property(e => e.Armadura).HasColumnName("armadura");

            // Reino
            entity.Property(e => e.Reino).HasColumnName("reino").HasMaxLength(50).IsRequired();

            // Posicao
            entity.Property(e => e.X).HasColumnName("x").HasDefaultValue(5000f);
            entity.Property(e => e.Y).HasColumnName("y").HasDefaultValue(5000f);

            // Estado (não persistido - só em memória durante o jogo)
            entity.Ignore(e => e.Estado);
            entity.Ignore(e => e.AlvoId);

            // Ranking
            entity.Property(e => e.Elo).HasColumnName("elo").HasDefaultValue(1000);
            entity.Property(e => e.Vitorias).HasColumnName("vitorias").HasDefaultValue(0);
            entity.Property(e => e.Derrotas).HasColumnName("derrotas").HasDefaultValue(0);

            // Metadata
            entity.Property(e => e.LastGitHubSync).HasColumnName("last_github_sync");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
        });

        // Battle
        modelBuilder.Entity<Battle>(entity =>
        {
            entity.ToTable("battles");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");

            entity.Property(e => e.Player1Id).HasColumnName("player1_id");
            entity.Property(e => e.Player2Id).HasColumnName("player2_id");
            entity.Property(e => e.WinnerId).HasColumnName("winner_id");

            entity.Property(e => e.DurationMs).HasColumnName("duration_ms");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

            // Relacionamentos
            entity.HasOne(e => e.Player1)
                .WithMany(p => p.BattlesAsPlayer1)
                .HasForeignKey(e => e.Player1Id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Player2)
                .WithMany(p => p.BattlesAsPlayer2)
                .HasForeignKey(e => e.Player2Id)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Winner)
                .WithMany(p => p.BattlesWon)
                .HasForeignKey(e => e.WinnerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Item
        modelBuilder.Entity<Item>(entity =>
        {
            entity.ToTable("items");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");

            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Tier).HasColumnName("tier").HasMaxLength(10).IsRequired();

            // Stats bonuses
            entity.Property(e => e.DanoBonus).HasColumnName("dano_bonus").HasDefaultValue(0);
            entity.Property(e => e.ArmaduraBonus).HasColumnName("armadura_bonus").HasDefaultValue(0);
            entity.Property(e => e.HpBonus).HasColumnName("hp_bonus").HasDefaultValue(0);
            entity.Property(e => e.CriticoBonus).HasColumnName("critico_bonus").HasDefaultValue(0);
            entity.Property(e => e.EvasaoBonus).HasColumnName("evasao_bonus").HasDefaultValue(0);
            entity.Property(e => e.VelocidadeAtaqueBonus).HasColumnName("velocidade_ataque_bonus").HasDefaultValue(0);
            entity.Property(e => e.VelocidadeMovimentoBonus).HasColumnName("velocidade_movimento_bonus").HasDefaultValue(0);

            // Duration
            entity.Property(e => e.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(e => e.DurationCondition).HasColumnName("duration_condition").HasMaxLength(50);

            // Visual
            entity.Property(e => e.VisualDescription).HasColumnName("visual_description").HasMaxLength(200);
        });

        // PlayerItem
        modelBuilder.Entity<PlayerItem>(entity =>
        {
            entity.ToTable("player_items");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");

            entity.Property(e => e.PlayerId).HasColumnName("player_id").IsRequired();
            entity.Property(e => e.ItemId).HasColumnName("item_id").IsRequired();

            entity.Property(e => e.AcquiredAt).HasColumnName("acquired_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.IsEquipped).HasColumnName("is_equipped").HasDefaultValue(false);

            // Relacionamentos
            entity.HasOne(e => e.Player)
                .WithMany(p => p.PlayerItems)
                .HasForeignKey(e => e.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Item)
                .WithMany(i => i.PlayerItems)
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indice para buscar itens por jogador
            entity.HasIndex(e => e.PlayerId);
        });
    }
}
