import { FastifyRequest, FastifyReply } from 'fastify'
import type { JwtPayload, Role } from '@jjcar/shared'

declare module 'fastify' {
  interface FastifyRequest {
    usuario: JwtPayload
  }
}

/**
 * Autentica o request. Retorna `true` se ok, `false` se já respondeu com erro.
 * Quem chama DEVE checar o retorno e parar a execução se for `false`.
 */
async function verificar(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  try {
    await req.jwtVerify()
    req.usuario = req.user as JwtPayload
    return true
  } catch {
    reply.status(401).send({ erro: 'Token inválido ou expirado' })
    return false
  }
}

export async function autenticar(req: FastifyRequest, reply: FastifyReply) {
  await verificar(req, reply)
}

export function exigirRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const ok = await verificar(req, reply)
    if (!ok) return // já respondeu 401 — interrompe
    if (!roles.includes(req.usuario.role)) {
      return reply.status(403).send({ erro: 'Sem permissão para esta ação' })
    }
  }
}

export function exigirPermissao(permissao: keyof JwtPayload['permissoes']) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const ok = await verificar(req, reply)
    if (!ok) return
    if (!req.usuario.permissoes[permissao]) {
      return reply.status(403).send({ erro: 'Permissão negada' })
    }
  }
}
