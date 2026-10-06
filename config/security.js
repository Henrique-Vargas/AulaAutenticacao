require('dotenv').config({ quiet: true });

// Falha rápida: sem segredo forte, a API não deve subir.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('ERRO FATAL: defina JWT_SECRET no arquivo .env (mínimo 32 caracteres).');
  process.exit(1);
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_ALGORITHM: 'HS256',
  // Work factor do BCrypt: cada +1 dobra o custo computacional do hash
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  ROLES: Object.freeze({ ADMIN: 'ADMIN', USER: 'USER' })
};
