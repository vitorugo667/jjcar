import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@jjcar/db'

const loginSchema = z.object({
  nomeDeLogin: z.string().min(1),
  senha: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos', detalhes: body.error.flatten() })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { nomeDeLogin: body.data.nomeDeLogin },
    })

    if (!usuario || !usuario.ativo) {
      return reply.status(401).send({ erro: 'Usuário ou senha inválidos' })
    }

    const senhaValida = await bcrypt.compare(body.data.senha, usuario.senhaHash)
    if (!senhaValida) {
      return reply.status(401).send({ erro: 'Usuário ou senha inválidos' })
    }

    const token = app.jwt.sign({
      sub: usuario.id,
      login: usuario.nomeDeLogin,
      role: usuario.role,
      permissoes: {
        verFinanceiro: usuario.verFinanceiro,
        verFotos: usuario.verFotos,
        registrarVeiculos: usuario.registrarVeiculos,
        registrarValorMes: usuario.registrarValorMes,
      },
    })

    return {
      token,
      usuario: {
        id: usuario.id,
        nomeCompleto: usuario.nomeCompleto,
        nomeDeLogin: usuario.nomeDeLogin,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
        permissoes: {
          verFinanceiro: usuario.verFinanceiro,
          verFotos: usuario.verFotos,
          registrarVeiculos: usuario.registrarVeiculos,
          registrarValorMes: usuario.registrarValorMes,
        },
        criadoEm: usuario.criadoEm,
      },
    }
  })
}
