const { Router } = require('express');
const controller = require('../controllers/AutorController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');
const { ROLES } = require('../config/security');

const router = Router();

router.get('/', (req, res, next) => controller.index(req, res, next));

// Rota Restrita: exclusivo ADMIN (401 sem token / 403 sem perfil)
router.post('/', autenticarToken, exigirRole(ROLES.ADMIN), (req, res, next) => controller.store(req, res, next));

module.exports = router;
