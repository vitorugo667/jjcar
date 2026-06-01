import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash(process.env.ADMIN_SENHA || 'Trocar@123', 12)

  const admin = await prisma.usuario.upsert({
    where: { nomeDeLogin: process.env.ADMIN_LOGIN || 'JJCAR.ADMIN' },
    update: {},
    create: {
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

  console.log('Admin criado:', admin.nomeDeLogin)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
