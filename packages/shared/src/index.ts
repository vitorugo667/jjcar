// Enums
export type Role = 'admin' | 'gerente' | 'operador' | 'financeiro'
export type StatusVeiculo = 'em_andamento' | 'aguardando_aprovacao' | 'encerrado' | 'cancelado'
export type StatusNotaFiscal = 'pendente' | 'emitida' | 'cancelada' | 'nao_aplicavel'
export type TipoServico = 'servico_interno' | 'seguradora' | 'outro'
export type TipoNotificacao = 'status_nf' | 'veiculo_encerrado' | 'orcamento_recebido'

// Auth
export interface LoginPayload {
  nomeDeLogin: string
  senha: string
}

export interface AuthResponse {
  token: string
  usuario: UsuarioPublico
}

export interface JwtPayload {
  sub: string
  login: string
  role: Role
  permissoes: Permissoes
}

// Usuario
export interface Permissoes {
  verFinanceiro: boolean
  verFotos: boolean
  registrarVeiculos: boolean
  registrarValorMes: boolean
}

export interface UsuarioPublico {
  id: string
  nomeCompleto: string
  nomeDeLogin: string
  email: string
  role: Role
  ativo: boolean
  permissoes: Permissoes
  criadoEm: string
}

export interface CriarUsuarioPayload {
  nomeCompleto: string
  nomeDeLogin: string
  email: string
  senhaInicial: string
  role: Role
  permissoes: Permissoes
}

export interface AtualizarPermissoesPayload {
  permissoes: Partial<Permissoes>
  role?: Role
}

// Veiculo
export interface CriarVeiculoPayload {
  placa: string
  nomeVeiculo: string
  descricaoServico?: string
  tipoServico: TipoServico
  seguradoraCliente?: string
  valorServico?: number
  fotos?: string[]
  orcamentoId?: string
}

export interface VeiculoPublico {
  id: string
  placa: string
  nomeVeiculo: string
  descricaoServico?: string
  tipoServico: TipoServico
  seguradoraCliente?: string
  valorServico?: number
  fotos: string[]
  status: StatusVeiculo
  notaFiscalStatus: StatusNotaFiscal
  notaFiscalNumero?: string
  usuarioResponsavel: { id: string; nomeDeLogin: string; nomeCompleto: string }
  orcamento?: OrcamentoPublico
  criadoEm: string
  encerradoEm?: string
}

export interface EncerrarVeiculoPayload {
  descricaoServico: string
  valorServico: number
  fotos: string[]
}

export interface AtualizarNotaFiscalPayload {
  notaFiscalStatus: StatusNotaFiscal
  notaFiscalNumero?: string
}

// Orcamento
export interface CriarOrcamentoPayload {
  tipo: TipoServico
  descricao: string
  arquivoUrl?: string
  valor: number
  seguradoraCliente?: string
  veiculoId?: string
}

export interface OrcamentoPublico {
  id: string
  tipo: TipoServico
  descricao: string
  arquivoUrl?: string
  valor: number
  seguradoraCliente?: string
  criadoEm: string
}

// Relatorio
export interface FiltroRelatorio {
  de?: string
  ate?: string
  usuarioId?: string
  tipoServico?: TipoServico
  seguradora?: string
}

export interface RelatorioFinanceiro {
  periodo: { de: string; ate: string }
  resumo: {
    receitaTotal: number
    totalVeiculos: number
    ticketMedio: number
  }
  graficoReceitaMes: { mes: string; valor: number }[]
  graficoPorUsuario: { usuarioLogin: string; valor: number }[]
  graficoPorTipo: { tipo: TipoServico; valor: number }[]
  lancamentos: LancamentoPublico[]
}

export interface LancamentoPublico {
  id: string
  data: string
  usuarioLogin: string
  placa: string
  nomeVeiculo: string
  tipoServico: TipoServico
  seguradoraCliente?: string
  valor: number
  notaFiscalStatus: StatusNotaFiscal
}

// Notificacao
export interface NotificacaoPublica {
  id: string
  tipo: TipoNotificacao
  mensagem: string
  lida: boolean
  veiculoId?: string
  criadoEm: string
}

// Erros
export interface ErroValidacao {
  sucesso: false
  erros: string[]
}

export interface Sucesso<T> {
  sucesso: true
  dados: T
}

export type Resposta<T> = Sucesso<T> | ErroValidacao

// Validação de encerramento
export function validarEncerramento(veiculo: {
  placa?: string
  nomeVeiculo?: string
  descricaoServico?: string
  valorServico?: number
  fotos?: string[]
}): ErroValidacao | null {
  const erros: string[] = []

  if (!veiculo.placa) erros.push('Placa é obrigatória')
  if (!veiculo.nomeVeiculo) erros.push('Nome do veículo é obrigatório')
  if (!veiculo.descricaoServico || veiculo.descricaoServico.length < 20)
    erros.push('Descrição do serviço deve ter ao menos 20 caracteres')
  if (!veiculo.valorServico || veiculo.valorServico <= 0)
    erros.push('Valor do serviço deve ser maior que zero')

  const fotosValidas = (veiculo.fotos ?? []).filter(
    (f) => f && f.startsWith('http'),
  )
  if (fotosValidas.length < 3)
    erros.push(`Mínimo 3 fotos obrigatórias. Enviadas: ${fotosValidas.length}`)

  return erros.length > 0 ? { sucesso: false, erros } : null
}

// Validação de nome_de_login
export function validarNomeDeLogin(login: string): boolean {
  return /^[A-Z0-9]+\.[A-Z0-9]+$/.test(login)
}
