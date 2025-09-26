# Cadastro do Pedro

Sistema de cadastro de produtos para bar desenvolvido com Next.js, Prisma e PostgreSQL.

## 🚀 Funcionalidades

- ✅ Sistema de autenticação (login/registro)
- ✅ Dashboard administrativo
- ✅ CRUD completo de produtos
- ✅ Controle de estoque
- ✅ Sistema de vendas
- ✅ Painel administrativo para gerenciar usuários
- ✅ Interface dark e responsiva

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, NextAuth.js
- **Banco de dados:** PostgreSQL com Prisma ORM
- **Deploy:** Vercel

## 📦 Instalação Local

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd cadastro-do-pedro
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cadastro_pedro?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App
NEXT_PUBLIC_APP_NAME="Cadastro do Pedro"
```

4. Configure o banco de dados:
```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar as migrações
npx prisma migrate dev --name init

# (Opcional) Visualizar o banco de dados
npx prisma studio
```

5. Execute o projeto:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no Vercel
- Banco PostgreSQL (recomendado: Neon, Supabase ou Railway)

### Passos para deploy:

1. **Prepare o banco de dados:**
   - Crie um banco PostgreSQL na nuvem
   - Anote a URL de conexão

2. **Configure o projeto no Vercel:**
   - Conecte seu repositório GitHub ao Vercel
   - Configure as variáveis de ambiente:
     ```env
     DATABASE_URL="sua-url-do-banco-postgresql"
     NEXTAUTH_URL="https://seu-dominio.vercel.app"
     NEXTAUTH_SECRET="seu-secret-seguro-aqui"
     NEXT_PUBLIC_APP_NAME="Cadastro do Pedro"
     ```

3. **Deploy:**
   - O Vercel fará o deploy automaticamente
   - Após o deploy, execute as migrações:
   ```bash
   npx prisma migrate deploy
   ```

4. **Criar usuário administrador:**
   Acesse `/register` e crie o primeiro usuário, depois promova-o a admin no banco de dados:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'seu-email@exemplo.com';
   ```

## 📋 Como usar

### Primeiro acesso:
1. Acesse a aplicação
2. Registre-se em `/register`
3. Promova seu usuário a ADMIN no banco de dados
4. Faça login e comece a usar o sistema

### Funcionalidades principais:

**Dashboard:**
- Visão geral do sistema
- Estatísticas de produtos e vendas
- Ações rápidas

**Produtos:**
- Cadastrar novos produtos
- Editar produtos existentes
- Controle de preços e categorias
- Códigos de barras

**Estoque:**
- Visualizar estoque atual
- Atualizar quantidades
- Alertas de estoque baixo
- Controle de estoque mínimo/máximo

**Vendas:**
- Sistema de PDV (Ponto de Venda)
- Carrinho de compras
- Múltiplas formas de pagamento
- Histórico de vendas

**Administração:**
- Gerenciar usuários
- Definir permissões (ADMIN/USER)
- Controle de acesso

## 🔧 Estrutura do Projeto

```
src/
├── app/
│   ├── api/              # API Routes
│   ├── dashboard/        # Dashboard
│   ├── products/         # Gestão de produtos
│   ├── inventory/        # Controle de estoque
│   ├── sales/           # Sistema de vendas
│   ├── users/           # Administração de usuários
│   ├── login/           # Autenticação
│   └── register/        # Registro
├── components/          # Componentes reutilizáveis
├── lib/                # Utilitários e configurações
└── types/              # Tipos TypeScript

prisma/
├── schema.prisma       # Schema do banco de dados
└── migrations/         # Migrações

```

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT via NextAuth.js
- Proteção de rotas por função (USER/ADMIN)
- Validação de dados no backend

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma issue no GitHub.

---

Desenvolvido com ❤️ para facilitar a gestão de bares e estabelecimentos similares.