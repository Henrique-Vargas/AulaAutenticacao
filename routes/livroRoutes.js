const { Router } = require('express');
const controller = require('../controllers/LivroController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/security');

const router = Router();

// Rotas Públicas

/**
 * @openapi
 * /livros:
 *   get:
 *     tags: [Livros]
 *     summary: Lista todos os livros
 *     description: |
 *       Rota pública. Retorna os livros com o nome do autor (`autor_nome`) e seus comentários.
 *       Se o autor não existir mais, `autor_nome` vem como "Autor Desconhecido".
 *     responses:
 *       200:
 *         description: Lista de livros.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Livro'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /livros/{id}:
 *   get:
 *     tags: [Livros]
 *     summary: Busca um livro pelo id
 *     description: Rota pública. Retorna o livro com o nome do autor e seus comentários.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Id do livro.
 *     responses:
 *       200:
 *         description: Livro encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livro'
 *       404:
 *         description: Livro não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'Livro não localizado.' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', (req, res, next) => controller.show(req, res, next));

// Rota Restrita: exclusivo ADMIN (401 sem token / 403 sem perfil)

/**
 * @openapi
 * /livros:
 *   post:
 *     tags: [Livros]
 *     summary: Cadastra um novo livro (exclusivo ADMIN)
 *     description: |
 *       Requer token de um usuário com perfil `ADMIN`.
 *
 *       Regras: `titulo` e `autor_id` são obrigatórios e o `autor_id` deve existir.
 *       Se `ano` não for informado, assume o ano atual. O livro é criado sem comentários.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LivroRequest'
 *     responses:
 *       201:
 *         description: Livro criado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LivroCriado'
 *       400:
 *         description: Falha de validação dos dados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'O título e o autor_id são obrigatórios.' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/ForbiddenAdmin'
 *       404:
 *         description: Autor informado não existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'O autor informado não existe.' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', autenticarToken, exigirRole(ROLES.ADMIN), (req, res, next) => controller.store(req, res, next));

// Rota Restrita: qualquer usuário autenticado (USER ou ADMIN)

/**
 * @openapi
 * /livros/{id}/comentarios:
 *   post:
 *     tags: [Livros]
 *     summary: Adiciona um comentário a um livro (USER ou ADMIN)
 *     description: |
 *       Requer token de qualquer usuário autenticado (`USER` ou `ADMIN`).
 *
 *       O autor do comentário (`usuario_id` e `autor_nome`) vem do token, não do corpo.
 *       O texto não pode ser vazio e é cortado em 1000 caracteres.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Id do livro.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComentarioRequest'
 *     responses:
 *       201:
 *         description: Comentário criado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comentario'
 *       400:
 *         description: Texto ausente ou vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'O texto do comentário não pode estar vazio.' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Livro não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'Livro não localizado.' }
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/comentarios', autenticarToken, exigirRole(ROLES.USER, ROLES.ADMIN), (req, res, next) => controller.storeComment(req, res, next));

module.exports = router;
