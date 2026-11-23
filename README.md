# NestMQ

API desenvolvida em NestJS para gerenciamento de clientes e relatórios de indicações, utilizando MongoDB, RabbitMQ para mensageria assíncrona e Redis para cache e deduplicação.

---

## 🚀 Como Rodar o Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie o arquivo `.env` na raiz do projeto (baseado no `.env.example`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nest-mq
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### 3. Subir Serviços Auxiliares (Redis & RabbitMQ)
```bash
docker compose up -d
```

### 4. Iniciar a Aplicação
```bash
# Modo desenvolvimento (com hot-reload)
npm run start:dev

# Build e execução em produção
npm run build
npm run start:prod
```

A documentação interativa Swagger estará disponível em: **`http://localhost:3000/api`**

---

## 🧪 Como Rodar os Testes

```bash
# Testes unitários
npm test

# Testes end-to-end (e2e)
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

---

## 📡 Exemplos para Testar a API

### 1. Criar Cliente (Sem indicação)
```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria.silva@example.com"
  }'
```

### 2. Criar Cliente com Indicação
> Substitua o `parent_customer_id` pelo `_id` de um cliente existente.
```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos Souza",
    "email": "carlos.souza@example.com",
    "parent_customer_id": "<ID_DO_CLIENTE_PAI>"
  }'
```
*O evento é publicado no RabbitMQ e consumido assincronamente para atualizar o total de indicações no relatório com deduplicação no Redis.*

### 3. Consultar Relatório de Indicações
```bash
curl -X GET http://localhost:3000/reports
```

### 4. Swagger UI
Acesse diretamente pelo navegador em `http://localhost:3000/api`.
