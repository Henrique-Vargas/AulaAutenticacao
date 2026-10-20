const { Router } = require('express');
const controller = require('../controllers/AuthController');

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Cadastra um novo usuário
 *     description: |
 *       Cria uma conta pública. O perfil é sempre `USER`: um campo `role` enviado no corpo é ignorado,
 *       impedindo que alguém se cadastre como `ADMIN`.
 *
 *       Regras: e-mail em formato válido e único (salvo em minúsculas); senha entre 8 caracteres e 72 bytes.
 *       A senha é armazenada como hash BCrypt e nunca é retornada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuário criado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Falha de validação dos dados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             examples:
 *               ausentes:
 *                 summary: Campos ausentes
 *                 value: { erro: 'Campos obrigatórios ausentes: nome, email ou senha.' }
 *               tipos:
 *                 summary: Tipos inválidos
 *                 value: { erro: 'Nome, e-mail e senha devem ser textos.' }
 *               email:
 *                 summary: E-mail inválido
 *                 value: { erro: 'E-mail em formato inválido.' }
 *               senha:
 *                 summary: Senha fora do tamanho
 *                 value: { erro: 'A senha deve ter entre 8 e 72 caracteres.' }
 *               json:
 *                 summary: JSON malformado
 *                 value: { erro: 'JSON inválido no corpo da requisição.' }
 *       409:
 *         description: E-mail já cadastrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'E-mail já cadastrado no sistema.' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/register', (req, res, next) => controller.register(req, res, next));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Autentica o usuário e retorna um token JWT
 *     description: |
 *       Valida e-mail e senha e devolve um token JWT (HS256) com `sub`, `nome` e `role`,
 *       válido pelo tempo de `JWT_EXPIRES_IN` (padrão 1h).
 *
 *       Copie o `token` da resposta e cole no botão **Authorize** para testar as rotas protegidas.
 *       E-mail inexistente e senha errada retornam a mesma mensagem, para não revelar quais e-mails existem.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Usuário ADMIN (seed)
 *               value: { email: 'admin@livraria.com', senha: 'Admin@123' }
 *             leitor:
 *               summary: Usuário USER (seed)
 *               value: { email: 'leitor@gmail.com', senha: 'Leitor@123' }
 *     responses:
 *       200:
 *         description: Login realizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: E-mail ou senha ausentes ou com tipo inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'E-mail e senha são obrigatórios.' }
 *       401:
 *         description: Credenciais inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'Credenciais inválidas.' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/login', (req, res, next) => controller.login(req, res, next));

module.exports = router;
