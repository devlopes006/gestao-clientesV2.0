# Módulo de Clientes - Nova Arquitetura Clean Architecture

## ✅ Implementação Completa

### 📁 Estrutura Criada

```
src/
├── core/
│   ├── domain/
│   │   └── client/
│   │       ├── entities/
│   │       │   └── client.entity.ts ✅
│   │       └── value-objects/
│   │           ├── email.vo.ts ✅
│   │           ├── cnpj.vo.ts ✅
│   │           └── client-status.vo.ts ✅
│   │
│   ├── use-cases/
│   │   └── client/
│   │       ├── create-client.use-case.ts ✅
│   │       ├── list-clients.use-case.ts ✅
│   │       ├── get-client.use-case.ts ✅
│   │       ├── update-client.use-case.ts ✅
│   │       └── delete-client.use-case.ts ✅
│   │
│   └── ports/
│       └── repositories/
│           └── client.repository.interface.ts ✅
│
├── infrastructure/
│   ├── database/
│   │   └── repositories/
│   │       └── prisma-client.repository.ts ✅
│   │
│   └── http/
│       └── controllers/
│           └── client.controller.ts ✅
│
└── app/
    └── api/
        └── clients/
            └── v2/
                ├── route.ts ✅ (POST /api/clients/v2, GET /api/clients/v2)
                └── [id]/
                    └── route.ts ✅ (GET, PUT, DELETE /api/clients/v2/:id)
```

---

## 🎯 Camadas Implementadas

### 1. **Domain Layer** (Regras de Negócio)

#### `Client.entity.ts`

- **Responsabilidade**: Entidade principal de Cliente com toda lógica de negócio
- **Métodos**:
  - `create()`: Factory method para criar novo cliente
  - `updateName()`: Atualizar nome do cliente
  - `updateEmail()`: Atualizar email (validado)
  - `updatePhone()`: Atualizar telefone
  - `activate()`: Ativar cliente
  - `inactivate()`: Inativar cliente
  - `suspend()`: Suspender cliente
  - `softDelete()`: Deletar cliente (soft delete)
  - `canBeUpdated()`: Validar se pode ser atualizado
  - `canBeDeleted()`: Validar se pode ser deletado
  - `canBeSuspended()`: Validar se pode ser suspenso

#### Value Objects

- **`Email.vo.ts`**: Validação de email (regex, formato)
- **`CNPJ.vo.ts`**: Validação de CNPJ (algoritmo de dígitos verificadores)
- **`ClientStatus.vo.ts`**: Enum para status do cliente (ATIVO, INATIVO, SUSPENSO, DELETADO)

---

### 2. **Use Cases Layer** (Casos de Uso)

#### `CreateClientUseCase`

- **Input**: name, email, phone?, cnpj?, cpf?, orgId
- **Output**: { clientId: string }
- **Validações**:
  - Email único na organização
  - CNPJ único na organização (se fornecido)
  - Validação de campos via Zod

#### `ListClientsUseCase`

- **Input**: orgId, page?, limit?, status[]?, search?
- **Output**: { clients, total, page, limit, totalPages }
- **Funcionalidades**:
  - Paginação
  - Filtro por status
  - Busca por nome/email

#### `GetClientUseCase`

- **Input**: clientId, orgId
- **Output**: { client }
- **Validações**:
  - Cliente existe
  - Cliente pertence à organização

#### `UpdateClientUseCase`

- **Input**: clientId, orgId, name?, email?, phone?
- **Output**: { clientId }
- **Validações**:
  - Cliente pode ser atualizado
  - Email único (se alterado)
  - Cliente pertence à organização

#### `DeleteClientUseCase`

- **Input**: clientId, orgId
- **Output**: { clientId }
- **Funcionalidade**: Soft delete do cliente
- **Validações**:
  - Cliente pode ser deletado
  - Cliente pertence à organização

---

### 3. **Ports Layer** (Interfaces)

#### `IClientRepository`

Interface que define contrato para persistência:

```typescript
- save(client: Client): Promise<void>
- findById(id: string): Promise<Client | null>
- findByEmail(email: string, orgId: string): Promise<Client | null>
- findByCNPJ(cnpj: string, orgId: string): Promise<Client | null>
- findByOrgId(orgId, options?): Promise<{ clients, total }>
- delete(id: string): Promise<void>
- exists(id: string): Promise<boolean>
```

---

### 4. **Infrastructure Layer** (Implementação)

#### `PrismaClientRepository`

- **Responsabilidade**: Implementação concreta do repositório usando Prisma
- **Métodos**: Todos os métodos da interface `IClientRepository`
- **Conversões**:
  - `toDomain()`: Converte dados do Prisma para entidade de domínio
  - `toPrisma()`: Converte entidade de domínio para dados do Prisma

#### `ClientController`

- **Responsabilidade**: Lidar com requisições HTTP
- **Características**:
  - Autenticação integrada usando `authenticateRequest` middleware
  - Tratamento de erros padronizado
  - Validação de permissões (OWNER para criação)
  - Retorno de status HTTP adequados (201, 400, 404, 500)

---

### 5. **Presentation Layer** (API Routes)

#### `POST /api/clients/v2`

- Criar novo cliente
- Requer role: OWNER

#### `GET /api/clients/v2`

- Listar clientes com paginação e filtros
- Query params: page, limit, status, search

#### `GET /api/clients/v2/:id`

- Buscar cliente específico

#### `PUT /api/clients/v2/:id`

- Atualizar cliente

#### `DELETE /api/clients/v2/:id`

- Deletar cliente (soft delete)

---

## 🔑 Princípios Aplicados

### ✅ SOLID

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Entidades abertas para extensão, fechadas para modificação
- **L**iskov Substitution: Repository interface pode ser substituído por qualquer implementação
- **I**nterface Segregation: Interfaces específicas e enxutas
- **D**ependency Inversion: Use cases dependem de interfaces, não de implementações concretas

### ✅ Clean Architecture

- **Independência de frameworks**: Lógica de negócio não depende do Prisma
- **Testabilidade**: Fácil mockar repositories para testes
- **Independência de UI**: Use cases podem ser reutilizados em qualquer interface
- **Independência de banco de dados**: Fácil trocar Prisma por outro ORM

### ✅ DDD (Domain-Driven Design)

- **Entities**: Cliente é uma entidade com identidade única
- **Value Objects**: Email e CNPJ são value objects imutáveis
- **Repository Pattern**: Abstração para persistência
- **Use Cases**: Representam casos de uso do negócio

---

## 📝 Próximos Passos

### Migração Gradual

1. ✅ Implementar módulo de clientes na nova estrutura
2. ⏳ Testar endpoints /api/clients/v2
3. ⏳ Atualizar frontend para usar novos endpoints
4. ⏳ Remover código antigo (/api/clients)
5. ⏳ Mover endpoints de /v2 para /clients

### Próximos Módulos

- [ ] Finance (invoices, transactions)
- [ ] Tasks
- [ ] Analytics
- [ ] Auth
- [ ] Organizations

---

## 🧪 Como Testar

### 1. Criar Cliente

```bash
POST /api/clients/v2
{
  "name": "Cliente Teste",
  "email": "teste@example.com",
  "phone": "11999999999",
  "cnpj": "12345678901234"
}
```

### 2. Listar Clientes

```bash
GET /api/clients/v2?page=1&limit=10&status=ATIVO&search=teste
```

### 3. Buscar Cliente

```bash
GET /api/clients/v2/:id
```

### 4. Atualizar Cliente

```bash
PUT /api/clients/v2/:id
{
  "name": "Nome Atualizado",
  "email": "novo@example.com"
}
```

### 5. Deletar Cliente

```bash
DELETE /api/clients/v2/:id
```

---

## 📚 Documentação Relacionada

- [REFATORACAO_COMPLETA.md](./REFATORACAO_COMPLETA.md) - Plano completo de refatoração
- [02-arquitetura-e-fluxos.md](./02-arquitetura-e-fluxos.md) - Documentação da arquitetura

---

**Data de Implementação**: Janeiro 2025  
**Status**: ✅ Completo e testável
