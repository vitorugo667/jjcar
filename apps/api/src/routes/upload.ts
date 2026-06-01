import { FastifyInstance } from 'fastify'
import { autenticar } from '../middleware/auth'

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: autenticar }, async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.status(400).send({ erro: 'Nenhum arquivo enviado' })

    // Valida tipo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!tiposPermitidos.includes(data.mimetype) && !data.mimetype.startsWith('image/')) {
      return reply.status(400).send({ erro: 'Apenas imagens são permitidas' })
    }

    const buffer = await data.toBuffer()

    // Valida tamanho (10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ erro: 'Arquivo muito grande. Máximo: 10MB' })
    }

    const storageUrl = process.env.STORAGE_URL
    const storageKey = process.env.STORAGE_KEY
    const bucket = process.env.STORAGE_BUCKET || 'jjcar-fotos'

    if (!storageUrl || !storageKey || storageUrl.includes('seu-bucket')) {
      return reply.status(503).send({
        erro: 'Storage não configurado. Configure STORAGE_URL e STORAGE_KEY no servidor.',
      })
    }

    const ext = data.filename.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `veiculos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const uploadUrl = `${storageUrl}/object/${bucket}/${filename}`

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${storageKey}`,
        'Content-Type': data.mimetype,
        'x-upsert': 'true',
      },
      body: buffer,
    })

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown')
      app.log.error({ uploadError: err }, 'Falha no upload para Supabase Storage')
      return reply.status(500).send({ erro: 'Falha ao fazer upload da foto' })
    }

    // URL pública do Supabase Storage
    const publicUrl = `${storageUrl}/object/public/${bucket}/${filename}`
    return reply.status(201).send({ url: publicUrl })
  })
}
