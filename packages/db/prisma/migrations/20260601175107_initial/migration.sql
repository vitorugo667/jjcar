-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'gerente', 'operador', 'financeiro');

-- CreateEnum
CREATE TYPE "StatusVeiculo" AS ENUM ('em_andamento', 'aguardando_aprovacao', 'encerrado', 'cancelado');

-- CreateEnum
CREATE TYPE "StatusNotaFiscal" AS ENUM ('pendente', 'emitida', 'cancelada', 'nao_aplicavel');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('servico_interno', 'seguradora', 'outro');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('status_nf', 'veiculo_encerrado', 'orcamento_recebido');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "nome_de_login" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'operador',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ver_financeiro" BOOLEAN NOT NULL DEFAULT false,
    "ver_fotos" BOOLEAN NOT NULL DEFAULT true,
    "registrar_veiculos" BOOLEAN NOT NULL DEFAULT true,
    "registrar_valor_mes" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "nome_veiculo" TEXT NOT NULL,
    "descricao_servico" TEXT,
    "tipo_servico" "TipoServico" NOT NULL,
    "seguradora_cliente" TEXT,
    "valor_servico" DECIMAL(10,2),
    "fotos" TEXT[],
    "status" "StatusVeiculo" NOT NULL DEFAULT 'em_andamento',
    "nota_fiscal_status" "StatusNotaFiscal" NOT NULL DEFAULT 'pendente',
    "nota_fiscal_numero" TEXT,
    "usuario_responsavel_id" TEXT NOT NULL,
    "orcamento_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerrado_em" TIMESTAMP(3),
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoServico" NOT NULL,
    "descricao" TEXT NOT NULL,
    "arquivo_url" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "seguradora_cliente" TEXT,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos_financeiros" (
    "id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "veiculo_id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "nome_veiculo" TEXT NOT NULL,
    "tipo_servico" "TipoServico" NOT NULL,
    "seguradora_cliente" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "nota_fiscal_status" "StatusNotaFiscal" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamentos_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "veiculo_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nome_de_login_key" ON "usuarios"("nome_de_login");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_usuario_responsavel_id_fkey" FOREIGN KEY ("usuario_responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
