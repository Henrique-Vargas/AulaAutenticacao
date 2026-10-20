const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

// Especificação base OpenAPI; os caminhos (paths) vêm das anotações @openapi em routes/*.js
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Livraria API',
    version: '1.0.0',
    description:
      'API RESTful de Livros e Autores com autenticação JWT e controle de acesso por perfil (RBAC).\n\n' +
      '**Como testar rotas protegidas:**\n' +
      '1. Execute `POST /auth/login` (ex.: `admin@livraria.com` / `Admin@123` ou `leitor@gmail.com` / `Leitor@123`).\n' +
      '2. Copie o valor de `token` da resposta.\n' +
      '3. Clique em **Authorize** e cole o token (sem o prefixo "Bearer").\n\n' +
      '**401 Unauthorized**: token ausente, mal formatado, adulterado ou expirado.\n' +
      '**403 Forbidden**: token válido, mas o perfil não tem permissão.'
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  tags: [
    { name: 'Auth', description: 'Cadastro e login de usuários' },
    { name: 'Livros', description: 'Consulta e cadastro de livros e comentários' },
    { name: 'Autores', description: 'Consulta e cadastro de autores' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido em POST /auth/login.'
      }
    },
    schemas: {
      Erro: {
        type: 'object',
        required: ['erro'],
        properties: {
          erro: { type: 'string', example: 'Mensagem descritiva do problema.' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', example: 'Maria Silva' },
          email: { type: 'string', format: 'email', example: 'maria.silva@email.com' },
          senha: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 72,
            example: 'SenhaForte@2024',
            description: 'Entre 8 caracteres e 72 bytes.'
          }
        }
      },
      Usuario: {
        type: 'object',
        required: ['id', 'nome', 'email', 'role'],
        properties: {
          id: { type: 'integer', example: 1760900000000 },
          nome: { type: 'string', example: 'Maria Silva' },
          email: { type: 'string', format: 'email', example: 'maria.silva@email.com' },
          role: { type: 'string', enum: ['ADMIN', 'USER'], example: 'USER' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@livraria.com' },
          senha: { type: 'string', format: 'password', example: 'Admin@123' }
        }
      },
      LoginResponse: {
        type: 'object',
        required: ['usuario', 'token', 'tipo', 'expiraEm'],
        properties: {
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              nome: { type: 'string', example: 'Admin' },
              role: { type: 'string', enum: ['ADMIN', 'USER'], example: 'ADMIN' }
            }
          },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21lIjoiQWRtaW4iLCJyb2xlIjoiQURNSU4ifQ.assinatura' },
          tipo: { type: 'string', example: 'Bearer' },
          expiraEm: { type: 'string', example: '1h' }
        }
      },
      Comentario: {
        type: 'object',
        required: ['id', 'usuario_id', 'autor_nome', 'texto'],
        properties: {
          id: { type: 'integer', example: 1760900000000 },
          usuario_id: { type: 'integer', example: 2 },
          autor_nome: { type: 'string', example: 'Leitor' },
          texto: { type: 'string', example: 'Leitura obrigatória para entender o realismo brasileiro.' }
        }
      },
      ComentarioRequest: {
        type: 'object',
        required: ['texto'],
        properties: {
          texto: {
            type: 'string',
            minLength: 1,
            maxLength: 1000,
            example: 'Leitura obrigatória para entender o realismo brasileiro.',
            description: 'Não pode ser vazio; textos acima de 1000 caracteres são cortados.'
          }
        }
      },
      Livro: {
        type: 'object',
        required: ['id', 'titulo', 'ano', 'autor_id', 'comentarios', 'autor_nome'],
        properties: {
          id: { type: 'integer', example: 1 },
          titulo: { type: 'string', example: 'Dom Casmurro' },
          ano: { type: 'integer', example: 1899 },
          autor_id: { type: 'integer', example: 1 },
          comentarios: { type: 'array', items: { $ref: '#/components/schemas/Comentario' } },
          autor_nome: { type: 'string', example: 'Machado de Assis' }
        }
      },
      LivroCriado: {
        type: 'object',
        required: ['id', 'titulo', 'ano', 'autor_id', 'comentarios'],
        properties: {
          id: { type: 'integer', example: 1760900000000 },
          titulo: { type: 'string', example: 'Memórias Póstumas de Brás Cubas' },
          ano: { type: 'integer', example: 1881 },
          autor_id: { type: 'integer', example: 1 },
          comentarios: { type: 'array', items: { $ref: '#/components/schemas/Comentario' }, example: [] }
        }
      },
      LivroRequest: {
        type: 'object',
        required: ['titulo', 'autor_id'],
        properties: {
          titulo: { type: 'string', example: 'Memórias Póstumas de Brás Cubas' },
          ano: { type: 'integer', example: 1881, description: 'Opcional; padrão: ano atual.' },
          autor_id: { type: 'integer', example: 1, description: 'Id de um autor existente.' }
        }
      },
      Autor: {
        type: 'object',
        required: ['id', 'nome', 'nacionalidade'],
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Machado de Assis' },
          nacionalidade: { type: 'string', example: 'Brasileiro' }
        }
      },
      AutorRequest: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', example: 'Clarice Lispector' },
          nacionalidade: { type: 'string', example: 'Brasileira', description: 'Opcional; padrão: "Não informada".' }
        }
      }
    },
    responses: {
      Unauthorized: {
        description: 'Token ausente, mal formatado, adulterado ou expirado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            examples: {
              ausente: { summary: 'Sem token', value: { erro: 'Token de autenticação não fornecido.' } },
              formato: { summary: 'Formato inválido', value: { erro: 'Formato inválido. Use: Authorization: Bearer <token>' } },
              expirado: { summary: 'Token expirado', value: { erro: 'Token expirado. Faça login novamente.' } },
              invalido: { summary: 'Token corrompido', value: { erro: 'Token inválido.' } }
            }
          }
        }
      },
      ForbiddenAdmin: {
        description: 'Usuário autenticado sem o perfil ADMIN.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Acesso proibido: privilégio de ADMIN exigido.' }
          }
        }
      },
      InternalError: {
        description: 'Erro inesperado no servidor.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Ocorreu um erro interno no servidor.' }
          }
        }
      }
    }
  }
};

module.exports = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')]
});
