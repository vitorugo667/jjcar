import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@jjcar/db'
import { autenticar, exigirRole } from '../middleware/auth'
import { validarEncerramento } from '@jjcar/shared'

const criarVeiculoSchema = z.object({
  placa: z.string().min(1),
  nomeVeiculo: z.string().min(1),
  descricaoServico: z.string().optional(),
  tipoServico: z.enum(['servico_interno', 'seguradora', 'outro']),
  seguradoraCliente: z.string().optional(),
  valorServico: z.number().positive().optional(),
  fotos: z.array(z.string().url()).default([]),
  orcamentoId: z.string().uuid().optional().nullable(),
})

const encerrarVeiculoSchema = z.object({
  descricaoServico: z.string().optional().default(''),
  valorServico: z.number().optional().default(0),
  fotos: z.array(z.string()).optional().default([]),
})

const notaFiscalSchema = z.object({
  notaFiscalStatus: z.enum(['pendente', 'emitida', 'cancelada', 'nao_aplicavel']),
  notaFiscalNumero: z.string().optional(),
})

function includeResponsavel() {
  return {
    usuarioResponsavel: { select: { id: true, nomeDeLogin: true, nomeCompleto: true } },
    orcamento: true,
  }
}

export async function veiculosRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: autenticar }, async (req, reply) => {
    const { status, placa, usuarioId } = req.query as {
      status?: string
      placa?: string
      usuarioId?: string
    }

    const where: any = {}
    if (status) where.status = status
    if (placa) where.placa = { contains: placa, mode: 'insensitive' }

    // Operadores só veem seus próprios veículos
    if (req.usuario.role === 'operador') {
      where.usuarioResponsavelId = req.usuario.sub
    } else if (usuarioId) {
      where.usuarioResponsavelId = usuarioId
    }

    const veiculos = await prisma.veiculo.findMany({
      where,
      include: includeResponsavel(),
      orderBy: { criadoEm: 'desc' },
    })

    return veiculos
  })

  app.get('/:id', { preHandler: autenticar }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
      include: includeResponsavel(),
    })
    if (!veiculo) return reply.status(404).send({ erro: 'Veículo não encontrado' })

    // Operador só pode ver o próprio veículo
    if (
      req.usuario.role === 'operador' &&
      veiculo.usuarioResponsavelId !== req.usuario.sub
    ) {
      return reply.status(403).send({ erro: 'Sem permissão' })
    }

    return veiculo
  })

  app.post('/', { preHandler: autenticar }, async (req, reply) => {
    if (!req.usuario.permissoes.registrarVeiculos) {
      return reply.status(403).send({ erro: 'Sem permissão para registrar veículos' })
    }

    const body = criarVeiculoSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos', detalhes: body.error.flatten() })
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        placa: body.data.placa,
        nomeVeiculo: body.data.nomeVeiculo,
        descricaoServico: body.data.descricaoServico,
        tipoServico: body.data.tipoServico,
        seguradoraCliente: body.data.seguradoraCliente,
        valorServico: body.data.valorServico,
        fotos: body.data.fotos,
        orcamentoId: body.data.orcamentoId,
        usuarioResponsavelId: req.usuario.sub,
      },
      include: includeResponsavel(),
    })

    return reply.status(201).send(veiculo)
  })

  app.patch('/:id', { preHandler: autenticar }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const veiculo = await prisma.veiculo.findUnique({ where: { id } })
    if (!veiculo) return reply.status(404).send({ erro: 'Veículo não encontrado' })

    const podeEditar =
      req.usuario.role === 'admin' ||
      req.usuario.role === 'gerente' ||
      veiculo.usuarioResponsavelId === req.usuario.sub

    if (!podeEditar) return reply.status(403).send({ erro: 'Sem permissão' })

    const body = criarVeiculoSchema.partial().safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos' })
    }

    const atualizado = await prisma.veiculo.update({
      where: { id },
      data: body.data as any,
      include: includeResponsavel(),
    })

    return atualizado
  })

  app.patch('/:id/encerrar', { preHandler: autenticar }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const veiculo = await prisma.veiculo.findUnique({ where: { id } })
    if (!veiculo) return reply.status(404).send({ erro: 'Veículo não encontrado' })

    const podeEncerrar =
      req.usuario.role === 'admin' ||
      req.usuario.role === 'gerente' ||
      veiculo.usuarioResponsavelId === req.usuario.sub

    if (!podeEncerrar) return reply.status(403).send({ erro: 'Sem permissão' })

    const body = encerrarVeiculoSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos' })
    }

    const erros = validarEncerramento({
      placa: veiculo.placa,
      nomeVeiculo: veiculo.nomeVeiculo,
      descricaoServico: body.data.descricaoServico,
      valorServico: body.data.valorServico,
      fotos: body.data.fotos,
    })

    if (erros) return reply.status(422).send(erros)

    const [veiculoAtualizado] = await prisma.$transaction([
      prisma.veiculo.update({
        where: { id },
        data: {
          status: 'encerrado',
          descricaoServico: body.data.descricaoServico,
          valorServico: body.data.valorServico,
          fotos: body.data.fotos,
          encerradoEm: new Date(),
        },
        include: includeResponsavel(),
      }),
      prisma.lancamentoFinanceiro.create({
        data: {
          data: new Date(),
          usuarioId: veiculo.usuarioResponsavelId,
          veiculoId: id,
          placa: veiculo.placa,
          nomeVeiculo: veiculo.nomeVeiculo,
          tipoServico: veiculo.tipoServico,
          seguradoraCliente: veiculo.seguradoraCliente,
          valor: body.data.valorServico,
          notaFiscalStatus: 'pendente',
        },
      }),
    ])

    // Notificar admins
    const admins = await prisma.usuario.findMany({
      where: { role: 'admin', ativo: true },
      select: { id: true },
    })
    if (admins.length > 0) {
      await prisma.notificacao.createMany({
        data: admins.map((a) => ({
          usuarioId: a.id,
          tipo: 'veiculo_encerrado' as const,
          mensagem: `Veículo ${veiculo.placa} encerrado por ${req.usuario.login} — EMITIR NOTA`,
          veiculoId: id,
        })),
      })
    }

    return veiculoAtualizado
  })

  app.patch('/:id/nota-fiscal', { preHandler: exigirRole('admin', 'financeiro') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = notaFiscalSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos' })
    }

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: {
        notaFiscalStatus: body.data.notaFiscalStatus,
        notaFiscalNumero: body.data.notaFiscalNumero,
      },
      include: includeResponsavel(),
    })

    // Atualiza lançamento financeiro
    await prisma.lancamentoFinanceiro.updateMany({
      where: { veiculoId: id },
      data: { notaFiscalStatus: body.data.notaFiscalStatus },
    })

    // Notifica o operador responsável
    await prisma.notificacao.create({
      data: {
        usuarioId: veiculo.usuarioResponsavelId,
        tipo: 'status_nf',
        mensagem:
          body.data.notaFiscalStatus === 'emitida'
            ? `Nota fiscal emitida para ${veiculo.placa}`
            : `Nota fiscal ${body.data.notaFiscalStatus} para ${veiculo.placa}`,
        veiculoId: id,
      },
    })

    return veiculo
  })

  app.delete('/:id', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.veiculo.update({
      where: { id },
      data: { status: 'cancelado' },
    })
    return { sucesso: true }
  })
}
