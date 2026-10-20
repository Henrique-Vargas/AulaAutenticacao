const { Router } = require('express');
const controller = require('../controllers/AutorController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/security');

const router = Router();

/**
 * @openapi
 * /autores:
 *   get:
 *     tags: [Autores]
 *     summary: Lista todos os autores
 *     description: Rota pública.
 *     responses:
 *       200:
 *         description: Lista de autores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Autor'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

// Rota Restrita: exclusivo ADMIN (401 sem token / 403 sem perfil)

/**
 * @openapi
 * /autores:
 *   post:
 *     tags: [Autores]
 *     summary: Cadastra um novo autor (exclusivo ADMIN)
 *     description: |
 *       Requer token de um usuário com perfil `ADMIN`.
 *
 *       Regras: `nome` é obrigatório e não pode ser vazio. Se `nacionalidade` não for informada,
 *       assume "Não informada".
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutorRequest'
 *     responses:
 *       201:
 *         description: Autor criado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Autor'
 *       400:
 *         description: Nome ausente ou vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: 'O nome do autor é obrigatório.' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/ForbiddenAdmin'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', autenticarToken, exigirRole(ROLES.ADMIN), (req, res, next) => controller.store(req, res, next));

module.exports = router;
