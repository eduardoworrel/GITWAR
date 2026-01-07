#!/bin/bash

# Script para adicionar jogadores reais do GitHub ao GitWorld
# Isso vai buscar os stats do GitHub e criar as entidades no jogo

API_URL="${API_URL:-http://localhost:5138}"

# Lista de usuários do GitHub
USERS=(
  "alexandrenolla"
  "Dougladmo"
  "Edinaelson"
  "eduardoworrel"
  "raphaelchristi"
  "Vigtu"
  "Ddiidev"
  "Joao620"
  "SilvioCarlos12"
)

echo "=========================================="
echo "  GitWorld - Adicionando Jogadores"
echo "=========================================="
echo ""
echo "API: $API_URL"
echo "Total de jogadores: ${#USERS[@]}"
echo ""

# Verificar se a API está rodando
if ! curl -s "$API_URL/game/state" > /dev/null 2>&1; then
  echo "ERRO: API não está respondendo em $API_URL"
  echo "Inicie o servidor com: dotnet run --urls=http://localhost:5138"
  exit 1
fi

echo "API online. Adicionando jogadores..."
echo ""

SUCCESS=0
FAILED=0

for username in "${USERS[@]}"; do
  echo -n "[$username] Entrando no jogo... "

  RESPONSE=$(curl -s -X POST "$API_URL/admin/add-player" \
    -H "Content-Type: application/json" \
    -d "{\"githubUsername\": \"$username\"}" \
    2>&1)

  # Verificar se foi sucesso
  if echo "$RESPONSE" | grep -q "entityId"; then
    REINO=$(echo "$RESPONSE" | grep -o '"reino":"[^"]*"' | cut -d'"' -f4)
    HP=$(echo "$RESPONSE" | grep -o '"hp":[0-9]*' | head -1 | cut -d':' -f2)
    echo "OK! Reino: $REINO, HP: $HP"
    ((SUCCESS++))
  else
    ERROR=$(echo "$RESPONSE" | grep -o '"detail":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$ERROR" ]; then
      ERROR="$RESPONSE"
    fi
    echo "FALHOU - $ERROR"
    ((FAILED++))
  fi

  # Pequena pausa para não sobrecarregar a API do GitHub
  sleep 1
done

echo ""
echo "=========================================="
echo "  Resultado"
echo "=========================================="
echo "Sucesso: $SUCCESS"
echo "Falhas:  $FAILED"
echo ""

# Mostrar estado atual do jogo
echo "Estado atual do jogo:"
curl -s "$API_URL/game/state" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    entities = data.get('entities', [])
    players = [e for e in entities if e.get('type') == 'Player']
    print(f'Total de players online: {len(players)}')
    print('')
    print('{:<20} {:<12} {:>6} {:>8}'.format('Nome', 'Reino', 'HP', 'Estado'))
    print('-' * 50)
    for p in sorted(players, key=lambda x: x.get('currentHp', 0), reverse=True):
        print('{:<20} {:<12} {:>3}/{:<3} {:>8}'.format(
            p.get('githubLogin', '?')[:20],
            p.get('reino', '?')[:12],
            p.get('currentHp', 0),
            p.get('maxHp', 0),
            p.get('state', '?')
        ))
except Exception as e:
    print(f'Erro ao processar resposta: {e}')
"
