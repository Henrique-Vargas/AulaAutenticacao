# 📚 Livraria API — Camada de Segurança

API RESTful de Livros e Autores (Clean Architecture) com:

- **Armazenamento seguro de credenciais** com BCrypt (salt aleatório + work factor configurável).
- **Autenticação stateless** com JWT no padrão `Authorization: Bearer <token>`.
- **Controle de acesso por perfil (RBAC)** com middlewares `autenticarToken` e `exigirRole`.

## Como executar

```bash
npm install
cp .env.example .env
# gere um segredo forte e cole em JWT_SECRET no .env:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
npm start
```

A API sobe em `http://localhost:3000`. Para o frontend de teste, abra `frontend/index.html` no navegador.

> Se existir um `database.txt` de uma versão anterior, apague-o: ele contém hashes inválidos
> e será recriado com hashes BCrypt reais na próxima execução.

### Usuários de seed

| E-mail               | Senha (padrão) | Perfil |
|----------------------|----------------|--------|
| admin@livraria.com   | `Admin@123`    | ADMIN  |
| leitor@gmail.com     | `Leitor@123`   | USER   |

As senhas podem ser trocadas por `SEED_ADMIN_PASSWORD` / `SEED_USER_PASSWORD` no `.env` (antes de o `database.txt` ser criado).

## Matriz de permissões

| Método | Rota                              | Acesso                 | Sucesso | Falha de segurança |
|--------|-----------------------------------|------------------------|---------|--------------------|
| GET    | `/api/v1/livros`                  | Público                | 200     | —                  |
| GET    | `/api/v1/livros/:id`              | Público                | 200     | —                  |
| POST   | `/api/v1/auth/register`           | Público                | 201     | —                  |
| POST   | `/api/v1/auth/login`              | Público                | 200     | 401                |
| POST   | `/api/v1/livros/:id/comentarios`  | Autenticado (USER/ADMIN) | 201   | 401                |
| POST   | `/api/v1/autores`                 | Exclusivo ADMIN        | 201     | 401 / 403          |
| POST   | `/api/v1/livros`                  | Exclusivo ADMIN        | 201     | 401 / 403          |

- **401 Unauthorized**: token ausente, mal formatado, adulterado ou expirado.
- **403 Forbidden**: token válido, mas o perfil não tem permissão.

## Decisões de segurança

**Credenciais (BCrypt)** — `services/AuthService.js`
- `bcrypt.hash(senha, BCRYPT_SALT_ROUNDS)` com work factor 12 (configurável). O salt é gerado
  automaticamente e fica embutido no próprio hash (`$2b$12$<salt><hash>`).
- Login usa `bcrypt.compare` (comparação em tempo constante).
- Mesma mensagem (`Credenciais inválidas.`) para e-mail inexistente e senha errada, e o compare é
  executado mesmo quando o usuário não existe (hash "fantasma"), dificultando enumeração de usuários.
- Senha entre 8 e 72 bytes (BCrypt ignora o que passa de 72).

**JWT** — `services/AuthService.js` e `middlewares/authMiddleware.js`
- Assinado com HS256 e segredo vindo do `.env`; a aplicação **não sobe** sem `JWT_SECRET` (≥ 32 caracteres).
- Payload mínimo: `sub` (id), `nome`, `role`, além de `iat`/`exp`. Nada sensível no token.
- Verificação com algoritmo fixado (`algorithms: ['HS256']`), o que bloqueia tokens forjados com `alg: none`.
- Expiração configurável (`JWT_EXPIRES_IN`, padrão 1h).

**RBAC** — `middlewares/authMiddleware.js` + `routes/*`
- `autenticarToken` → identifica (401). `exigirRole(...roles)` → autoriza (403).
- **Correção de escalonamento de privilégio:** o código original aceitava `role` no corpo do
  `/auth/register`, permitindo que qualquer pessoa se cadastrasse como ADMIN. Agora o cadastro público
  sempre cria `USER`.

**Outros ajustes**
- Frontend: correção de **XSS armazenado** — títulos e comentários eram inseridos via `innerHTML`
  sem escape, o que permitiria roubar o JWT do `localStorage`. Agora todo dado da API passa por `escapeHtml`.
- Comentários gravam `usuario_id` e nome vindos do **token**, não do corpo da requisição.
- Erros 500 não vazam detalhes internos; JSON malformado retorna 400; body limitado a 10 kb;
  header `X-Powered-By` desativado.

## Testando com cURL

```bash
# Login (guarda o token)
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@livraria.com","senha":"Admin@123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Rota ADMIN
curl -i -X POST localhost:3000/api/v1/livros \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"titulo":"Memórias Póstumas de Brás Cubas","ano":1881,"autor_id":1}'
```
