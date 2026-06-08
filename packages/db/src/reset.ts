import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Limpa TODOS os dados operacionais do banco e recria apenas o admin.
 * Uso: pnpm --filter @jjcar/db reset
 */
async function main() {
  console.log('🧹 Limpando banco de dados...')

  // Ordem importa por causa das foreign keys
  await prisma.notificacao.deleteMany({})
  console.log('  ✓ Notificações apagadas')

  await prisma.lancamentoFinanceiro.deleteMany({})
  console.log('  ✓ Lançamentos financeiros apagados')

  // Desvincula veículos de orçamentos antes de apagar
  await prisma.veiculo.updateMany({ data: { orcamentoId: null } })
  await prisma.veiculo.deleteMany({})
  console.log('  ✓ Veículos apagados')

  await prisma.orcamento.deleteMany({})
  console.log('  ✓ Orçamentos apagados')

  await prisma.usuario.deleteMany({})
  console.log('  ✓ Usuários apagados')

  // Recria o admin
  const senhaHash = await bcrypt.hash(process.env.ADMIN_SENHA || 'Trocar@123', 12)
  const admin = await prisma.usuario.create({
    data: {
      nomeCompleto: 'Administrador JJCAR',
      nomeDeLogin: process.env.ADMIN_LOGIN || 'JJCAR.ADMIN',
      email: process.env.ADMIN_EMAIL || 'admin@jjcar.com',
      senhaHash,
      role: 'admin',
      verFinanceiro: true,
      verFotos: true,
      registrarVeiculos: true,
      registrarValorMes: true,
    },
  })

  console.log('')
  console.log('✅ Banco limpo e admin recriado!')
  console.log(`   Login: ${admin.nomeDeLogin}`)
  console.log(`   Senha: ${process.env.ADMIN_SENHA || 'Trocar@123'}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
