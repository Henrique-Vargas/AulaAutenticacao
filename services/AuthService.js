const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/LivrariaRepository');
const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ALGORITHM,
  BCRYPT_SALT_ROUNDS,
  ROLES
} = require('../config/security');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN = 8;
const SENHA_MAX = 72; // BCrypt ignora bytes além de 72

// Hash "fantasma" usado quando o e-mail não existe, para que o tempo de resposta
// do login seja parecido nos dois casos (mitiga enumeração de usuários por timing).
const HASH_FANTASMA = bcrypt.hashSync('senha-inexistente-para-timing', BCRYPT_SALT_ROUNDS);

class AuthService {
  async registrar({ nome, email, senha } = {}) {
    if (!nome || !email || !senha) {
      throw { status: 400, message: "Campos obrigatórios ausentes: nome, email ou senha." };
    }
    if (typeof nome !== 'string' || typeof email !== 'string' || typeof senha !== 'string') {
      throw { status: 400, message: "Nome, e-mail e senha devem ser textos." };
    }
    if (!EMAIL_REGEX.test(email)) {
      throw { status: 400, message: "E-mail em formato inválido." };
    }
    if (senha.length < SENHA_MIN || Buffer.byteLength(senha, 'utf8') > SENHA_MAX) {
      throw { status: 400, message: `A senha deve ter entre ${SENHA_MIN} e ${SENHA_MAX} caracteres.` };
    }

    const emailNormalizado = email.trim().toLowerCase();
    if (repository.buscarUsuarioPorEmail(emailNormalizado)) {
      throw { status: 409, message: "E-mail já cadastrado no sistema." };
    }

    // BCrypt gera um salt aleatório e o embute no próprio hash ($2b$<custo>$<salt><hash>)
    const senha_hash = await bcrypt.hash(senha, BCRYPT_SALT_ROUNDS);

    const novoUsuario = repository.salvarUsuario({
      nome: nome.trim(),
      email: emailNormalizado,
      senha_hash,
      // SEGURANÇA: o perfil NUNCA vem do cliente. Cadastro público sempre cria USER.
      // (Aceitar "role" do body permitiria que qualquer um se registrasse como ADMIN.)
      role: ROLES.USER
    });

    const { senha_hash: _, ...usuarioRetorno } = novoUsuario;
    return usuarioRetorno;
  }

  async login({ email, senha } = {}) {
    if (!email || !senha || typeof email !== 'string' || typeof senha !== 'string') {
      throw { status: 400, message: "E-mail e senha são obrigatórios." };
    }

    const usuario = repository.buscarUsuarioPorEmail(email);

    // Sempre executa o compare (com hash fantasma se o usuário não existir)
    const senhaConfere = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FANTASMA);

    // Mesma mensagem para "usuário inexistente" e "senha errada"
    if (!usuario || !senhaConfere) {
      throw { status: 401, message: "Credenciais inválidas." };
    }

    const token = jwt.sign(
      { nome: usuario.nome, role: usuario.role },
      JWT_SECRET,
      {
        subject: String(usuario.id),
        expiresIn: JWT_EXPIRES_IN,
        algorithm: JWT_ALGORITHM
      }
    );

    return {
      usuario: { id: usuario.id, nome: usuario.nome, role: usuario.role },
      token,
      tipo: 'Bearer',
      expiraEm: JWT_EXPIRES_IN
    };
  }
}

module.exports = new AuthService();
