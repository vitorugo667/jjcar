import { FastifyInstance } from 'fastify'
import { prisma } from '@jjcar/db'
import { exigirRole } from '../middleware/auth'

export async function backupRoutes(app: FastifyInstance) {
  // Backup completo em JSON — admin e financeiro
  app.get(
    '/',
    { preHandler: exigirRole('admin', 'financeiro') },
    async (req, reply) => {
      const [veiculos, orcamentos, lancamentos, usuarios] = await Promise.all([
        prisma.veiculo.findMany({
          include: {
            usuarioResponsavel: { select: { nomeDeLogin: true, nomeCompleto: true } },
            orcamento: true,
          },
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.orcamento.findMany({
          include: { criadoPor: { select: { nomeDeLogin: true } } },
          orderBy: { criadoEm: 'desc' },
        }),
        prisma.lancamentoFinanceiro.findMany({
          orderBy: { data: 'desc' },
        }),
        prisma.usuario.findMany({
          select: {
            id: true,
            nomeCompleto: true,
            nomeDeLogin: true,
            email: true,
            role: true,
            ativo: true,
            criadoEm: true,
          },
        }),
      ])

      return {
        exportadoEm: new Date().toISOString(),
        totais: {
          veiculos: veiculos.length,
          orcamentos: orcamentos.length,
          lancamentos: lancamentos.length,
          usuarios: usuarios.length,
        },
        veiculos,
        orcamentos,
        lancamentos,
        usuarios,
      }
    },
  )

  // Resumo rápido (contagens) — para exibir no painel sem baixar tudo
  app.get(
    '/resumo',
    { preHandler: exigirRole('admin', 'financeiro') },
    async (req, reply) => {
      const [veiculos, orcamentos, lancamentos, usuarios] = await Promise.all([
        prisma.veiculo.count(),
        prisma.orcamento.count(),
        prisma.lancamentoFinanceiro.count(),
        prisma.usuario.count(),
      ])

      const receitaTotal = await prisma.lancamentoFinanceiro.aggregate({
        _sum: { valor: true },
      })

      return {
        veiculos,
        orcamentos,
        lancamentos,
        usuarios,
        receitaTotal: receitaTotal._sum.valor ?? 0,
      }
    },
  )
}
