// Script para criar o bucket jjcar-fotos no Supabase Storage
// Execute: node criar-bucket.js

const https = require('https')

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZHNidnh1c3hrZHN3ZHlncXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMyMjY5MSwiZXhwIjoyMDk1ODk4NjkxfQ.GUDIq21hdcXif2CAuJaVQ4Jby_YSIOjHhzbgxO_k6bk'
const HOST = 'vudsbvxusxkdswdygqxk.supabase.co'
const BUCKET = 'jjcar-fotos'

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: HOST,
      port: 443,
      path: '/storage/v1' + path,
      method,
      headers: {
        Authorization: 'Bearer ' + TOKEN,
        apikey: TOKEN,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function main() {
  console.log('🔍 Verificando buckets existentes...')

  const list = await request('GET', '/bucket')

  if (!Array.isArray(list.body)) {
    console.error('❌ Erro ao listar buckets:', list.body)
    process.exit(1)
  }

  const existe = list.body.find((b) => b.id === BUCKET || b.name === BUCKET)

  if (existe) {
    console.log(`✅ Bucket "${BUCKET}" já existe!`)
    // Garante público
    await request('PUT', '/bucket/' + BUCKET, { public: true })
    console.log('📢 Bucket confirmado como público.')
    console.log('\n🎉 Tudo pronto! O upload de fotos já está configurado.')
    return
  }

  console.log(`🪣 Criando bucket "${BUCKET}"...`)

  const create = await request('POST', '/bucket', {
    id: BUCKET,
    name: BUCKET,
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  })

  if (create.status === 200 || create.status === 201) {
    console.log(`✅ Bucket "${BUCKET}" criado com sucesso!`)
    console.log('\n🎉 Tudo pronto! O upload de fotos está configurado.')
  } else {
    console.error('❌ Erro ao criar bucket (status ' + create.status + '):', create.body)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('❌ Erro:', e.message)
  process.exit(1)
})
