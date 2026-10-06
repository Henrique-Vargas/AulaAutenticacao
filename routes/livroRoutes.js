const { Router } = require('express');
const controller = require('../controllers/LivroController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/security');

const router = Router();

// Rotas Públicas
router.get('/', (req, res, next) => controller.index(req, res, next));
router.get('/:id', (req, res, next) => controller.show(req, res, next));

// Rota Restrita: exclusivo ADMIN (401 sem token / 403 sem perfil)
router.post('/', autenticarToken, exigirRole(ROLES.ADMIN), (req, res, next) => controller.store(req, res, next));

// Rota Restrita: qualquer usuário autenticado (USER ou ADMIN)
router.post('/:id/comentarios', autenticarToken, exigirRole(ROLES.USER, ROLES.ADMIN), (req, res, next) => controller.storeComment(req, res, next));

module.exports = router;
