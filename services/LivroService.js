const repository = require('../repositories/LivrariaRepository');

class LivroService {
  listarTodos() {
    const livros = repository.listarLivros();
    const autores = repository.listarAutores();

    return livros.map(livro => {
      const autor = autores.find(a => a.id === livro.autor_id);
      return {
        ...livro,
        autor_nome: autor ? autor.nome : "Autor Desconhecido"
      };
    });
  }

  buscarPorId(id) {
    const livro = repository.buscarLivroPorId(id);
    if (!livro) {
      throw { status: 404, message: "Livro não localizado." };
    }

    const autor = repository.buscarAutorPorId(livro.autor_id);
    return {
      ...livro,
      autor_nome: autor ? autor.nome : "Autor Desconhecido"
    };
  }

  criar({ titulo, ano, autor_id }) {
    if (!titulo || typeof titulo !== 'string' || !autor_id) {
      throw { status: 400, message: "O título e o autor_id são obrigatórios." };
    }

    const autor = repository.buscarAutorPorId(autor_id);
    if (!autor) {
      throw { status: 404, message: "O autor informado não existe." };
    }

    return repository.salvarLivro({
      titulo: titulo.trim(),
      ano: ano || new Date().getFullYear(),
      autor_id: Number(autor_id)
    });
  }

  adicionarComentario(livroId, { texto, usuario }) {
    if (!usuario) {
      throw { status: 401, message: "Usuário não autenticado." };
    }
    if (typeof texto !== 'string' || texto.trim() === "") {
      throw { status: 400, message: "O texto do comentário não pode estar vazio." };
    }

    this.buscarPorId(livroId);

    return repository.adicionarComentario(livroId, {
      usuario_id: usuario.id,
      autor_nome: usuario.nome,
      texto: texto.trim().slice(0, 1000)
    });
  }
}

module.exports = new LivroService();