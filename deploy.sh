#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 Iniciando Deploy - Triton Backend"
echo "=========================================="

# 1. Verifica existência do arquivo .env
if [ ! -f .env ]; then
  echo "❌ Erro: Arquivo .env não encontrado no diretório atual!"
  echo "👉 Crie o arquivo .env a partir do .env.example antes de rodar o deploy."
  exit 1
fi

# 2. Atualiza o código do repositório
echo "📥 Atualizando código via Git..."
git pull origin main

# 3. Constrói e sobe os containers
echo "🐳 Construindo e iniciando containers Docker..."
docker compose up -d --build --remove-orphans

# 4. Aguarda o PostgreSQL e a API ficarem prontos
echo "⏳ Aguardando serviços ficarem operacionais..."
sleep 5

# 5. Executa migrações / inicialização do banco (schema e seed)
echo "📦 Executando inicialização do banco de dados (schema & seed)..."
docker compose exec -T api npm run db:init

# 6. Status final dos containers
echo ""
echo "=========================================="
echo "✅ Deploy concluído com sucesso!"
echo "=========================================="
docker compose ps

# 7. Teste de saúde local
echo ""
echo "💓 Testando endpoint de healthcheck local:"
curl -s http://127.0.0.1:3001/api/health || echo "⚠️ Não foi possível verificar o healthcheck localmente."
echo ""

