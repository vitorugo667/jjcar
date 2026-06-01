import { FastifyRequest, FastifyReply } from 'fastify'
import type { JwtPayload, Role } from '@jjcar/shared'

declare module 'fastify' {
  interface FastifyRequest {
    usuario: JwtPayload
  }
}

export async function autenticar(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    req.usuario = req.user as JwtPayload
  } catch {
    reply.status(401).send({ erro: 'Token inválido ou expirado' })
  }
}

export function exigirRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await autenticar(req, reply)
    if (!roles.includes(req.usuario.role)) {
      reply.status(403).send({ erro: 'Sem permissão para esta ação' })
    }
  }
}

export function exigirPermissao(permissao: keyof JwtPayload['permissoes']) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await autenticar(req, reply)
    if (!req.usuario.permissoes[permissao]) {
      reply.status(403).send({ erro: 'Permissão negada' })
    }
  }
}
