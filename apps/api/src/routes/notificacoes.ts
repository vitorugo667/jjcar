import { FastifyInstance } from 'fastify'
import { prisma } from '@jjcar/db'
import { autenticar } from '../middleware/auth'

export async function notificacoesRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: autenticar }, async (req, reply) => {
    const notificacoes = await prisma.notificacao.findMany({
      where: { usuarioId: req.usuario.sub },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    })
    return notificacoes
  })

  app.patch('/:id/lida', { preHandler: autenticar }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.notificacao.update({
      where: { id, usuarioId: req.usuario.sub },
      data: { lida: true },
    })
    return { sucesso: true }
  })

  app.patch('/marcar-todas-lidas', { preHandler: autenticar }, async (req, reply) => {
    await prisma.notificacao.updateMany({
      where: { usuarioId: req.usuario.sub, lida: false },
      data: { lida: true },
    })
    return { sucesso: true }
  })
}
