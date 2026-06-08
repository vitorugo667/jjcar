import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@jjcar/db'
import { autenticar } from '../middleware/auth'

const loginSchema = z.object({
  nomeDeLogin: z.string().min(1),
  senha: z.string().min(1),
})

const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  senhaNova: z.string().min(6, 'A nova senha deve ter ao menos 6 caracteres'),
})

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/login',
    {
      // Protege contra força bruta: máx 5 tentativas por minuto por IP
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
          errorResponseBuilder: () => ({
            erro: 'Muitas tentativas de login. Aguarde 1 minuto e tente novamente.',
          }),
        },
      },
    },
    async (req, reply) => {
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

      const permissoes = {
        verFinanceiro: usuario.verFinanceiro,
        verFotos: usuario.verFotos,
        registrarVeiculos: usuario.registrarVeiculos,
        registrarValorMes: usuario.registrarValorMes,
      }

      const token = app.jwt.sign({
        sub: usuario.id,
        login: usuario.nomeDeLogin,
        role: usuario.role,
        permissoes,
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
          permissoes,
          criadoEm: usuario.criadoEm,
        },
      }
    },
  )

  // Trocar a própria senha
  app.patch('/senha', { preHandler: autenticar }, async (req, reply) => {
    const body = trocarSenhaSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: body.error.issues[0]?.message || 'Dados inválidos' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.sub } })
    if (!usuario) return reply.status(404).send({ erro: 'Usuário não encontrado' })

    const senhaCorreta = await bcrypt.compare(body.data.senhaAtual, usuario.senhaHash)
    if (!senhaCorreta) {
      return reply.status(401).send({ erro: 'Senha atual incorreta' })
    }

    const novoHash = await bcrypt.hash(body.data.senhaNova, 12)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senhaHash: novoHash },
    })

    return { sucesso: true }
  })
}
