require('./config/security'); // carrega .env e valida JWT_SECRET antes de tudo
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const livroRoutes = require('./routes/livroRoutes');
const autorRoutes = require('./routes/autorRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Agrupamento Semântico de Rotas (RESTful /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/livros', livroRoutes);
app.use('/api/v1/autores', autorRoutes);

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Livraria API rodando em http://localhost:${PORT}`);
});