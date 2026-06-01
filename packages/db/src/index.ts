export { PrismaClient } from '@prisma/client'
export type {
  Usuario,
  Veiculo,
  Orcamento,
  LancamentoFinanceiro,
  Notificacao,
  Role,
  StatusVeiculo,
  StatusNotaFiscal,
  TipoServico,
  TipoNotificacao,
} from '@prisma/client'

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['warn', 'error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
