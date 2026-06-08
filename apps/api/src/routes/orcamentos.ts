import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@jjcar/db'
import { exigirRole, autenticar } from '../middleware/auth'

const criarOrcamentoSchema = z.object({
  tipo: z.enum(['servico_interno', 'seguradora', 'outro']),
  descricao: z.string().min(1),
  arquivoUrl: z.string().url().optional(),
  valor: z.number().positive(),
  seguradoraCliente: z.string().optional(),
  veiculoId: z.string().uuid().optional(),
})

export async function orcamentosRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: autenticar }, async (req, reply) => {
    const orcamentos = await prisma.orcamento.findMany({
      include: { criadoPor: { select: { nomeDeLogin: true } } },
      orderBy: { criadoEm: 'desc' },
    })
    return orcamentos
  })

  app.post('/', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const body = criarOrcamentoSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos', detalhes: body.error.flatten() })
    }

    const orcamento = await prisma.orcamento.create({
      data: {
        tipo: body.data.tipo,
        descricao: body.data.descricao,
        arquivoUrl: body.data.arquivoUrl,
        valor: body.data.valor,
        seguradoraCliente: body.data.seguradoraCliente,
        criadoPorId: req.usuario.sub,
      },
    })

    if (body.data.veiculoId) {
      await prisma.veiculo.update({
        where: { id: body.data.veiculoId },
        data: { orcamentoId: orcamento.id },
      })

      await prisma.notificacao.createMany({
        data: [
          {
            usuarioId: req.usuario.sub,
            tipo: 'orcamento_recebido',
            mensagem: `Novo orçamento recebido — ${body.data.seguradoraCliente || body.data.tipo}`,
            veiculoId: body.data.veiculoId,
          },
        ],
      })
    }

    return reply.status(201).send(orcamento)
  })

  app.patch('/:id', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = criarOrcamentoSchema.partial().safeParse(req.body)
    if (!body.success) return reply.status(400).send({ erro: 'Dados inválidos' })

    const orcamento = await prisma.orcamento.update({
      where: { id },
      data: body.data,
    })
    return orcamento
  })

  app.delete('/:id', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    // Desvincular veículos antes de deletar
    await prisma.veiculo.updateMany({
      where: { orcamentoId: id },
      data: { orcamentoId: null },
    })
    await prisma.orcamento.delete({ where: { id } })
    return { sucesso: true }
  })

  app.patch('/:id/veiculo', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { veiculoId } = req.body as { veiculoId: string }

    await prisma.veiculo.update({
      where: { id: veiculoId },
      data: { orcamentoId: id },
    })

    return { sucesso: true }
  })
}
