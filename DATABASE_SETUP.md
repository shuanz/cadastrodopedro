# Configuração do Banco de Dados

## Para desenvolvimento local

### Opção 1: Docker (Recomendado)
```bash
# Executar PostgreSQL com Docker
docker run --name cadastro-pedro-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cadastro_pedro \
  -p 5432:5432 \
  -d postgres:15

# Configurar .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cadastro_pedro?schema=public"
```

### Opção 2: PostgreSQL local
1. Instale PostgreSQL
2. Crie um banco chamado `cadastro_pedro`
3. Configure a URL no .env.local

### Executar migrações
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# Popular com dados iniciais
npm run db:seed
```

## Para produção (Vercel)

### Provedores de banco recomendados:

#### 1. Neon (Recomendado)
- Acesse: https://neon.tech
- Crie uma conta gratuita
- Crie um novo projeto
- Copie a connection string
- Configure no Vercel como `DATABASE_URL`

#### 2. Supabase
- Acesse: https://supabase.com
- Crie um projeto
- Vá em Settings > Database
- Copie a connection string
- Configure no Vercel como `DATABASE_URL`

#### 3. Railway
- Acesse: https://railway.app
- Crie um projeto PostgreSQL
- Copie a connection string
- Configure no Vercel como `DATABASE_URL`

### Deploy no Vercel

1. **Conecte o repositório ao Vercel**

2. **Configure as variáveis de ambiente:**
   ```env
   DATABASE_URL="sua-connection-string-postgresql"
   NEXTAUTH_URL="https://seu-app.vercel.app"
   NEXTAUTH_SECRET="seu-secret-muito-seguro-aqui"
   NEXT_PUBLIC_APP_NAME="Cadastro do Pedro"
   ```

3. **Após o primeiro deploy, execute:**
   ```bash
   # No terminal local, com DATABASE_URL apontando para produção
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Primeiro acesso:**
   - Acesse seu app
   - Faça login com: admin@cadastrodopedro.com / admin123
   - Altere a senha imediatamente
   - Comece a usar o sistema!

### Comandos úteis:

```bash
# Ver o banco de dados
npx prisma studio

# Reset do banco (cuidado em produção!)
npx prisma migrate reset

# Deploy das migrações
npx prisma migrate deploy

# Popular com dados iniciais
npm run db:seed
```
