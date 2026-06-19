export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  dataNascimento: string;
  cidade: string;
  estado: string;
  profissao: string;
  estadoCivil: string;
  filhos: boolean;
  interesses: string[];
  comoConheceu: string;
  aceiteLgpd: boolean;
  createdAt: string;
}

export interface EmotionalMetadata {
  humor: number; // 0-10
  energia: number; // 0-10
  ansiedade: number; // 0-10
  estresse: number; // 0-10
  qualidade_do_sono: number; // 0-10
  tema_principal: string;
  tema_secundario: string;
  sentimento_predominante: string;
  interesse_em_cafe: boolean;
  interesse_em_terapia: boolean;
  interesse_em_grupo: boolean;
  data_hora: string;
}

export interface ChatMessage {
  id: string;
  usuarioId: string;
  sender: 'user' | 'celle';
  text: string;
  timestamp: string;
  metadata?: EmotionalMetadata; // Se for extraído nessa mensagem
}

export interface Agendamento {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  data: string;
  hora: string;
  tipo: 'cafe_presencial' | 'atendimento_online' | 'atendimento_presencial';
  observacoes: string;
  status: 'confirmado' | 'pendente';
  createdAt: string;
}

export interface TherapeuticSession {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  data: string;
  resumoSessao: string;
  observacoesClinicas: string;
  hipotesesClinicas: string;
  planoTerapeutico: string;
  aiGenerated?: {
    resumoClinico: string;
    evolucaoClinica: string;
    possiveisTemasAprofundamento: string[];
    resumoSimplificadoPaciente: string;
    sugestoesAutocuidado: string[];
  };
  createdAt: string;
}

export interface WhatsAppLog {
  id: string;
  phone: string;
  name: string;
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  type: 'welcome' | 'rules' | 'chat' | 'notification';
}
