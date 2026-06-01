import { FastifyInstance } from 'fastify'
import { prisma } from '@jjcar/db'
import { autenticar } from '../middleware/auth'

export async function relatoriosRoutes(app: FastifyInstance) {
  app.get('/financeiro', { preHandler: autenticar }, async (req, reply) => {
    if (!req.usuario.permissoes.verFinanceiro) {
      return reply.status(403).send({ erro: 'Sem permissão para ver relatório financeiro' })
    }

    const { de, ate, usuarioId, tipoServico, seguradora } = req.query as {
      de?: string
      ate?: string
      usuarioId?: string
      tipoServico?: string
      seguradora?: string
    }

    const dataInicio = de ? new Date(de) : new Date(new Date().getFullYear(), 0, 1)
    const dataFim = ate ? new Date(ate) : new Date()

    const where: any = {
      data: { gte: dataInicio, lte: dataFim },
    }
    if (usuarioId) where.usuarioId = usuarioId
    if (tipoServico) where.tipoServico = tipoServico
    if (seguradora) where.seguradoraCliente = { contains: seguradora, mode: 'insensitive' }

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where,
      include: { usuario: { select: { nomeDeLogin: true } } },
      orderBy: { data: 'desc' },
    })

    const receitaTotal = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0)
    const totalVeiculos = lancamentos.length
    const ticketMedio = totalVeiculos > 0 ? receitaTotal / totalVeiculos : 0

    // Receita por mês
    const porMes = new Map<string, number>()
    for (const l of lancamentos) {
      const mes = l.data.toISOString().slice(0, 7)
      porMes.set(mes, (porMes.get(mes) ?? 0) + Number(l.valor))
    }
    const graficoReceitaMes = Array.from(porMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({ mes, valor }))

    // Por usuário
    const porUsuario = new Map<string, number>()
    for (const l of lancamentos) {
      const login = l.usuario.nomeDeLogin
      porUsuario.set(login, (porUsuario.get(login) ?? 0) + Number(l.valor))
    }
    const graficoPorUsuario = Array.from(porUsuario.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([usuarioLogin, valor]) => ({ usuarioLogin, valor }))

    // Por tipo
    const porTipo = new Map<string, number>()
    for (const l of lancamentos) {
      porTipo.set(l.tipoServico, (porTipo.get(l.tipoServico) ?? 0) + Number(l.valor))
    }
    const graficoPorTipo = Array.from(porTipo.entries()).map(([tipo, valor]) => ({
      tipo,
      valor,
    }))

    return {
      periodo: {
        de: dataInicio.toISOString().slice(0, 10),
        ate: dataFim.toISOString().slice(0, 10),
      },
      resumo: { receitaTotal, totalVeiculos, ticketMedio },
      graficoReceitaMes,
      graficoPorUsuario,
      graficoPorTipo,
      lancamentos: lancamentos.map((l) => ({
        id: l.id,
        data: l.data.toISOString().slice(0, 10),
        usuarioLogin: l.usuario.nomeDeLogin,
        placa: l.placa,
        nomeVeiculo: l.nomeVeiculo,
        tipoServico: l.tipoServico,
        seguradoraCliente: l.seguradoraCliente,
        valor: Number(l.valor),
        notaFiscalStatus: l.notaFiscalStatus,
      })),
    }
  })

  app.get('/financeiro/exportar', { preHandler: autenticar }, async (req, reply) => {
    if (!req.usuario.permissoes.verFinanceiro) {
      return reply.status(403).send({ erro: 'Sem permissão' })
    }

    const { formato = 'csv' } = req.query as { formato?: string }

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      include: { usuario: { select: { nomeDeLogin: true } } },
      orderBy: { data: 'desc' },
    })

    if (formato === 'csv') {
      const header = 'Data,Usuário,Placa,Veículo,Tipo,Seguradora/Cliente,Valor,Nota Fiscal\n'
      const linhas = lancamentos
        .map(
          (l) =>
            `${l.data.toISOString().slice(0, 10)},${l.usuario.nomeDeLogin},${l.placa},${l.nomeVeiculo},${l.tipoServico},${l.seguradoraCliente ?? ''},${Number(l.valor).toFixed(2)},${l.notaFiscalStatus}`,
        )
        .join('\n')

      reply.header('Content-Type', 'text/csv; charset=utf-8')
      reply.header('Content-Disposition', 'attachment; filename=relatorio-jjcar.csv')
      return reply.send(header + linhas)
    }

    return reply.status(400).send({ erro: 'Formato não suportado. Use: csv' })
  })
}
