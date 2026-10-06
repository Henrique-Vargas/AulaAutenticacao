function errorHandler(err, req, res, next) {
  // JSON malformado no body (lançado pelo express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
  }

  const statusCode = err.status || 500;

  // Erros 500 não devem vazar detalhes internos (stack, mensagens de bibliotecas etc.)
  if (statusCode >= 500) {
    console.error(err);
    return res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
  }

  return res.status(statusCode).json({ erro: err.message });
}

module.exports = errorHandler;
