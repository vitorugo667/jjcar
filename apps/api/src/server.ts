import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'

import { authRoutes } from './routes/auth'
import { usuariosRoutes } from './routes/usuarios'
import { veiculosRoutes } from './routes/veiculos'
import { orcamentosRoutes } from './routes/orcamentos'
import { relatoriosRoutes } from './routes/relatorios'
import { notificacoesRoutes } from './routes/notificacoes'
import { uploadRoutes } from './routes/upload'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-trocar-em-producao',
  sign: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
})

app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } })

app.register(authRoutes, { prefix: '/auth' })
app.register(usuariosRoutes, { prefix: '/usuarios' })
app.register(veiculosRoutes, { prefix: '/veiculos' })
app.register(orcamentosRoutes, { prefix: '/orcamentos' })
app.register(relatoriosRoutes, { prefix: '/relatorios' })
app.register(notificacoesRoutes, { prefix: '/notificacoes' })
app.register(uploadRoutes, { prefix: '/upload' })

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3001
    const host = process.env.API_HOST || '0.0.0.0'
    await app.listen({ port, host })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
