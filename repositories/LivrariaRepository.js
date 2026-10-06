const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { BCRYPT_SALT_ROUNDS } = require('../config/security');

class LivrariaRepository {
  constructor() {
    // Garante que o arquivo fique na raiz do projeto (onde o server.js roda)
    this.dbPath = path.resolve(process.cwd(), 'database.txt');
    this._garantirArquivoInicial();
  }

  _obterDadosPadrao() {
    // Senhas de seed nunca ficam em texto puro no banco: são convertidas em hash BCrypt
    const senhaAdmin = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const senhaLeitor = process.env.SEED_USER_PASSWORD || 'Leitor@123';

    return {
      usuarios: [
        { id: 1, nome: "Admin", email: "admin@livraria.com", senha_hash: bcrypt.hashSync(senhaAdmin, BCRYPT_SALT_ROUNDS), role: "ADMIN" },
        { id: 2, nome: "Leitor", email: "leitor@gmail.com", senha_hash: bcrypt.hashSync(senhaLeitor, BCRYPT_SALT_ROUNDS), role: "USER" }
      ],
      autores: [
        { id: 1, nome: "Machado de Assis", nacionalidade: "Brasileiro" }
      ],
      livros: [
        {
          id: 1,
          titulo: "Dom Casmurro",
          ano: 1899,
          autor_id: 1,
          comentarios: [
            { id: 1, usuario_id: 2, autor_nome: "Leitor", texto: "Clássico indispensável." }
          ]
        }
      ]
    };
  }

  _garantirArquivoInicial() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        this.salvar(this._obterDadosPadrao());
      } else {
        const conteudo = fs.readFileSync(this.dbPath, 'utf-8').trim();
        if (!conteudo) {
          this.salvar(this._obterDadosPadrao());
        }
      }
    } catch (err) {
      console.error("Erro ao inicializar database.txt:", err);
    }
  }

  carregar() {
    try {
      this._garantirArquivoInicial();
      const rawData = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(rawData);
    } catch (e) {
      return this._obterDadosPadrao();
    }
  }

  salvar(dados) {
    fs.writeFileSync(this.dbPath, JSON.stringify(dados, null, 2), 'utf-8');
  }

  // Métodos de Usuários
  buscarUsuarioPorEmail(email) {
    const db = this.carregar();
    const alvo = String(email).trim().toLowerCase();
    return db.usuarios.find(u => u.email.toLowerCase() === alvo) || null;
  }

  salvarUsuario(usuario) {
    const db = this.carregar();
    const novoUsuario = { id: Date.now(), ...usuario };
    db.usuarios.push(novoUsuario);
    this.salvar(db);
    return novoUsuario;
  }

  // Métodos de Autores
  listarAutores() {
    return this.carregar().autores || [];
  }

  buscarAutorPorId(id) {
    return (this.carregar().autores || []).find(a => a.id === Number(id)) || null;
  }

  salvarAutor(autor) {
    const db = this.carregar();
    const novoAutor = { id: Date.now(), ...autor };
    db.autores.push(novoAutor);
    this.salvar(db);
    return novoAutor;
  }

  // Métodos de Livros
  listarLivros() {
    return this.carregar().livros || [];
  }

  buscarLivroPorId(id) {
    return (this.carregar().livros || []).find(l => l.id === Number(id)) || null;
  }

  salvarLivro(livro) {
    const db = this.carregar();
    const novoLivro = { id: Date.now(), ...livro, comentarios: [] };
    db.livros.push(novoLivro);
    this.salvar(db);
    return novoLivro;
  }

  adicionarComentario(livroId, comentario) {
    const db = this.carregar();
    const livro = db.livros.find(l => l.id === Number(livroId));
    if (!livro) return null;

    if (!livro.comentarios) livro.comentarios = [];

    const novoComentario = { id: Date.now(), ...comentario };
    livro.comentarios.push(novoComentario);
    this.salvar(db);
    return novoComentario;
  }
}

module.exports = new LivrariaRepository();