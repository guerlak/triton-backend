# Triton Backend (Node.js + TypeScript + Express + PostgreSQL + Cloudflare R2)

API RESTful para gerenciar dados de eventos Triton e processar uploads de mídia para o Cloudflare R2 com otimização automática.

---

## ⚙️ Configuração das Variáveis de Ambiente

No diretório `backend/`, crie ou edite o seu `.env` com base no [`.env.example`](file:///Users/guerlak/Workspace/projetos/triton-web/backend/.env.example):

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*

# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/triton_db?schema=public"

# Cloudflare R2 Object Storage
CLOUDFLARE_ACCOUNT_ID="seu_account_id"
R2_ACCESS_KEY_ID="seu_access_key_id"
R2_SECRET_ACCESS_KEY="seu_secret_access_key"
R2_BUCKET_NAME="triton-media"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev"
```

---

## 🚀 Como Executar

### 1. Instalar as dependências
```bash
cd backend
npm install
```

### 2. Inicializar o banco de dados e seed de eventos
```bash
npm run db:init
```

### 3. Iniciar o servidor em desenvolvimento
```bash
npm run dev
```
Servidor disponível em: `http://localhost:3001`

---

## 📡 Endpoints da API

A URL base da API é `http://localhost:3001/api`.

### 1. Upload de Arquivos (`/api/upload`)

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/upload` | Envia **1 arquivo** (`multipart/form-data`, campo `file`). Converte imagens automaticamente para WebP otimizado |
| `POST` | `/api/upload/multiple` | Envia **múltiplos arquivos** (campo `files`, até 10 arquivos simultâneos) |

#### Exemplo de requisição no Frontend Admin (Upload):
```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("folder", "events/salvador-2026"); // opcional

const response = await fetch("http://localhost:3001/api/upload", {
  method: "POST",
  body: formData,
});

const { data } = await response.json();
console.log(data.url); // "https://pub-xxx.r2.dev/events/salvador-2026/1730335000-banner-a1b2c3.webp"
```

---

### 2. Eventos (`/api/events`)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/events` | Lista eventos (filtros: `eventFormat`, `year`, `status`, `language`, `search`) |
| `GET` | `/api/events/:idOrSlug` | Retorna o evento completo com modalidades, cronograma, hotel e POIs |
| `POST` | `/api/events` | Cria um novo evento |
| `PUT` | `/api/events/:idOrSlug` | Atualiza um evento existente |
| `DELETE` | `/api/events/:idOrSlug` | Remove um evento (cascata no banco) |

---

## 📁 Estrutura de Pastas do Backend

```text
backend/
├── database/
│   └── schema.sql              # DDL completo do PostgreSQL
├── src/
│   ├── config/
│   │   ├── database.ts         # Pool nativo do PostgreSQL (pg)
│   │   └── r2.ts               # Conexão S3 com Cloudflare R2
│   ├── controllers/
│   │   ├── event.controller.ts # Lógica HTTP de eventos
│   │   └── upload.controller.ts# Lógica HTTP de upload
│   ├── data/
│   │   └── initialEvents.ts    # Seed com eventos do eventData.ts
│   ├── database/
│   │   └── init.ts             # Script de inicialização (npm run db:init)
│   ├── middlewares/
│   │   ├── errorHandler.ts     # Tratamento global de erros
│   │   └── upload.middleware.ts# Multer em memória com filtro de mimetypes
│   ├── routes/
│   │   ├── event.routes.ts
│   │   ├── upload.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── event.service.ts    # Queries SQL diretas para eventos
│   │   └── storage.service.ts  # Otimização com Sharp e envio para R2
│   ├── types/
│   │   └── event.types.ts      # Tipagens TypeScript completas
│   ├── app.ts                  # Configuração do Express e CORS
│   └── server.ts               # Ponto de entrada do servidor
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```
