export type Etapa = "novo" | "contato" | "diagnostico" | "proposta" | "negociacao" | "ganho" | "perdido";

export type Lead = {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  whatsapp?: string;
  cargo?: string;
  canal?: string;
  origem: string;
  etapa: Etapa;
  tipo_servico?: string;
  valor_estimado?: number;
  valor_fechado?: number;
  proxima_acao?: string;
  data_proxima_acao?: string;
  data_fechamento_prevista?: string;
  motivo_perda?: string;
  motivo_ganho?: string;
  categoria_perda?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  data_ganho?: string;
  data_perda?: string;
  criado_em: string;
  atualizado_em: string;
};

export const COLUNAS: { id: Etapa; label: string; cor: string; prob: number }[] = [
  { id: "novo",        label: "Novo Lead",             cor: "#6B6B6B", prob: 10 },
  { id: "contato",     label: "Contato Realizado",      cor: "#C9A84C", prob: 25 },
  { id: "diagnostico", label: "Diagnóstico Agendado",   cor: "#2196F3", prob: 50 },
  { id: "proposta",    label: "Proposta Enviada",        cor: "#9C27B0", prob: 70 },
  { id: "negociacao",  label: "Em Negociação",           cor: "#FF9800", prob: 85 },
  { id: "ganho",       label: "Ganho",                  cor: "#2D6A4F", prob: 100 },
  { id: "perdido",     label: "Perdido",                cor: "#C1121F", prob: 0 },
];
