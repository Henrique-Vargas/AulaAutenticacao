const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_ALGORITHM } = require('../config/security');

/**
 * Autenticação stateless: valida o header "Authorization: Bearer <token>".
 * Em caso de sucesso, injeta os dados do usuário em req.usuario.
 * Falhas de autenticação => 401 Unauthorized.
 */
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res
      .status(401)
      .set('WWW-Authenticate', 'Bearer')
      .json({ erro: "Token de autenticação não fornecido." });
  }

  const [esquema, token] = authHeader.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return res
      .status(401)
      .set('WWW-Authenticate', 'Bearer error="invalid_request"')
      .json({ erro: "Formato inválido. Use: Authorization: Bearer <token>" });
  }

  try {
    // Fixar o algoritmo impede ataques de troca de algoritmo (ex.: "alg": "none")
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });

    req.usuario = {
      id: Number(payload.sub),
      nome: payload.nome,
      role: payload.role
    };
    return next();
  } catch (err) {
    const mensagem = err.name === 'TokenExpiredError'
      ? "Token expirado. Faça login novamente."
      : "Token inválido.";
    return res
      .status(401)
      .set('WWW-Authenticate', 'Bearer error="invalid_token"')
      .json({ erro: mensagem });
  }
}

/**
 * Autorização (RBAC): exige que o usuário autenticado possua um dos perfis informados.
 * Deve ser usado SEMPRE depois de autenticarToken.
 * Usuário autenticado sem o perfil => 403 Forbidden.
 */
function exigirRole(...rolesPermitidas) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Usuário não autenticado." });
    }
    if (!rolesPermitidas.includes(req.usuario.role)) {
      return res
        .status(403)
        .json({ erro: `Acesso proibido: privilégio de ${rolesPermitidas.join(' ou ')} exigido.` });
    }
    return next();
  };
}

module.exports = { autenticarToken, exigirRole };
