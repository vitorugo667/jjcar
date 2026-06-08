import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'

import { authRoutes } from './routes/auth'
import { usuariosRoutes } from './routes/usuarios'
import { veiculosRoutes } from './routes/veiculos'
import { orcamentosRoutes } from './routes/orcamentos'
import { relatoriosRoutes } from './routes/relatorios'
import { notificacoesRoutes } from './routes/notificacoes'
import { uploadRoutes } from './routes/upload'
import { backupRoutes } from './routes/backup'

// ── Validação de segredo obrigatório ──────────────────────────────
// Em produção, NUNCA usar um segredo padrão (qualquer um forjaria tokens de admin).
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET ausente ou fraco (mín. 32 caracteres). Configure no ambiente.')
    process.exit(1)
  }
  console.warn('[AVISO] JWT_SECRET fraco — aceitável apenas em desenvolvimento.')
}

const app = Fastify({ logger: true })

// CORS — aceita múltiplas origens separadas por vírgula
const origensPermitidas = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

app.register(cors, {
  origin: origensPermitidas.length === 1 ? origensPermitidas[0] : origensPermitidas,
  credentials: true,
})

// Rate limiting global — protege contra abuso e força bruta
app.register(rateLimit, {
  global: false, // aplicado seletivamente por rota
  max: 200,
  timeWindow: '1 minute',
})

app.register(jwt, {
  secret: JWT_SECRET || 'dev-secret-apenas-local-nao-usar-em-producao',
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
app.register(backupRoutes, { prefix: '/backup' })

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  try {
    // Render injeta PORT automaticamente; API_PORT é fallback local
    const port = Number(process.env.PORT) || Number(process.env.API_PORT) || 3001
    const host = process.env.API_HOST || '0.0.0.0'
    console.log(`[startup] iniciando servidor na porta ${port}...`)
    await app.listen({ port, host })
    console.log(`[startup] servidor ouvindo em ${host}:${port}`)
  } catch (err) {
    console.error('[startup] ERRO ao iniciar servidor:', err)
    app.log.error(err)
    process.exit(1)
  }
}

start()
