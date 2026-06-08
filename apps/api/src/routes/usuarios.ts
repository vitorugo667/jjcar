import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@jjcar/db'
import { autenticar, exigirRole } from '../middleware/auth'
import { validarNomeDeLogin } from '@jjcar/shared'

const criarUsuarioSchema = z.object({
  nomeCompleto: z.string().min(2),
  nomeDeLogin: z.string().refine(validarNomeDeLogin, {
    message: 'Login deve seguir o formato PREFIXO.NOME em maiúsculas',
  }),
  email: z.string().email(),
  senhaInicial: z.string().min(6),
  role: z.enum(['admin', 'gerente', 'operador', 'financeiro']),
  permissoes: z.object({
    verFinanceiro: z.boolean().default(false),
    verFotos: z.boolean().default(true),
    registrarVeiculos: z.boolean().default(true),
    registrarValorMes: z.boolean().default(false),
  }),
})

const atualizarPermissoesSchema = z.object({
  role: z.enum(['admin', 'gerente', 'operador', 'financeiro']).optional(),
  permissoes: z.object({
    verFinanceiro: z.boolean().optional(),
    verFotos: z.boolean().optional(),
    registrarVeiculos: z.boolean().optional(),
    registrarValorMes: z.boolean().optional(),
  }).optional(),
})

function formatarUsuario(u: any) {
  return {
    id: u.id,
    nomeCompleto: u.nomeCompleto,
    nomeDeLogin: u.nomeDeLogin,
    email: u.email,
    role: u.role,
    ativo: u.ativo,
    permissoes: {
      verFinanceiro: u.verFinanceiro,
      verFotos: u.verFotos,
      registrarVeiculos: u.registrarVeiculos,
      registrarValorMes: u.registrarValorMes,
    },
    criadoEm: u.criadoEm,
  }
}

export async function usuariosRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
    })
    return usuarios.map(formatarUsuario)
  })

  app.get('/me', { preHandler: autenticar }, async (req, reply) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.sub },
    })
    if (!usuario) return reply.status(404).send({ erro: 'Usuário não encontrado' })
    return formatarUsuario(usuario)
  })

  app.post('/', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const body = criarUsuarioSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos', detalhes: body.error.flatten() })
    }

    const existente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { nomeDeLogin: body.data.nomeDeLogin },
          { email: body.data.email },
        ],
      },
    })
    if (existente) {
      return reply.status(409).send({ erro: 'Login ou e-mail já cadastrado' })
    }

    const senhaHash = await bcrypt.hash(body.data.senhaInicial, 12)
    const usuario = await prisma.usuario.create({
      data: {
        nomeCompleto: body.data.nomeCompleto,
        nomeDeLogin: body.data.nomeDeLogin,
        email: body.data.email,
        senhaHash,
        role: body.data.role,
        verFinanceiro: body.data.permissoes.verFinanceiro,
        verFotos: body.data.permissoes.verFotos,
        registrarVeiculos: body.data.permissoes.registrarVeiculos,
        registrarValorMes: body.data.permissoes.registrarValorMes,
      },
    })

    return reply.status(201).send(formatarUsuario(usuario))
  })

  app.patch('/:id/permissoes', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = atualizarPermissoesSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ erro: 'Dados inválidos' })
    }

    // Proteção: não permitir rebaixar o último admin ativo
    if (body.data.role && body.data.role !== 'admin') {
      const alvo = await prisma.usuario.findUnique({ where: { id } })
      if (alvo?.role === 'admin') {
        const totalAdmins = await prisma.usuario.count({ where: { role: 'admin', ativo: true } })
        if (totalAdmins <= 1) {
          return reply.status(409).send({
            erro: 'Não é possível rebaixar o último administrador ativo do sistema.',
          })
        }
      }
    }

    const dados: any = {}
    if (body.data.role) dados.role = body.data.role
    if (body.data.permissoes) {
      const p = body.data.permissoes
      if (p.verFinanceiro !== undefined) dados.verFinanceiro = p.verFinanceiro
      if (p.verFotos !== undefined) dados.verFotos = p.verFotos
      if (p.registrarVeiculos !== undefined) dados.registrarVeiculos = p.registrarVeiculos
      if (p.registrarValorMes !== undefined) dados.registrarValorMes = p.registrarValorMes
    }

    const usuario = await prisma.usuario.update({ where: { id }, data: dados })
    return formatarUsuario(usuario)
  })

  app.patch('/:id/ativar', { preHandler: exigirRole('admin') }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { ativo } = req.body as { ativo: boolean }

    // Proteção: não permitir desativar o último admin ativo, nem desativar a si mesmo
    if (ativo === false) {
      if (id === req.usuario.sub) {
        return reply.status(409).send({ erro: 'Você não pode desativar a própria conta.' })
      }
      const alvo = await prisma.usuario.findUnique({ where: { id } })
      if (alvo?.role === 'admin') {
        const totalAdmins = await prisma.usuario.count({ where: { role: 'admin', ativo: true } })
        if (totalAdmins <= 1) {
          return reply.status(409).send({ erro: 'Não é possível desativar o último administrador ativo.' })
        }
      }
    }

    const usuario = await prisma.usuario.update({ where: { id }, data: { ativo } })
    return formatarUsuario(usuario)
  })
}
