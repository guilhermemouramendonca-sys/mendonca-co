import { PERGUNTAS_Q12 } from "@/lib/pesquisas/q12";
import { AFIRMACOES_GPTW } from "@/lib/pesquisas/gptw";

export type RespostaIndividual = {
  id: string;
  respondente_nome: string;
  respondente_email: string;
  respondente_cargo?: string;
  resultado: Record<string, unknown>;
  respostas: Record<number, number>;
  criado_em: string;
};

// ── Q12 ──────────────────────────────────────────────────────────

export type ConsolidadoQ12 = {
  totalRespondentes: number;
  mediaGeral: number;        // 1-5
  percentualGeral: number;   // 0-100
  porDimensao: Record<string, { media: number; percentual: number }>;
  porPergunta: { id: number; texto: string; dimensao: string; media: number; percentual: number }[];
  distribuicao: { alto: number; medio: number; baixo: number }; // % de respondentes
  nivel: string;
  cor: string;
};

export function consolidarQ12(respostas: RespostaIndividual[]): ConsolidadoQ12 {
  const n = respostas.length;
  if (n === 0) throw new Error("Sem respostas para consolidar");

  // Média por pergunta
  const porPergunta = PERGUNTAS_Q12.map((p) => {
    const vals = respostas.map((r) => r.respostas?.[p.id]).filter((v) => v != null) as number[];
    const media = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const percentual = Math.round(((media - 1) / 4) * 100);
    return { id: p.id, texto: p.texto, dimensao: p.dimensao, media, percentual };
  });

  // Média por dimensão
  const dims = ["Necessidades Básicas", "Suporte Individual", "Trabalho em Equipe", "Crescimento"];
  const porDimensao: Record<string, { media: number; percentual: number }> = {};
  for (const dim of dims) {
    const ps = porPergunta.filter((p) => p.dimensao === dim);
    const media = ps.reduce((a, b) => a + b.media, 0) / ps.length;
    porDimensao[dim] = { media, percentual: Math.round(((media - 1) / 4) * 100) };
  }

  // Média geral
  const mediaGeral = porPergunta.reduce((a, b) => a + b.media, 0) / porPergunta.length;
  const percentualGeral = Math.round(((mediaGeral - 1) / 4) * 100);

  // Distribuição de respondentes por nível
  const distribuicao = { alto: 0, medio: 0, baixo: 0 };
  for (const r of respostas) {
    const pct = (r.resultado as Record<string, number>)?.percentual ?? 0;
    if (pct >= 70) distribuicao.alto++;
    else if (pct >= 40) distribuicao.medio++;
    else distribuicao.baixo++;
  }

  let nivel: string, cor: string;
  if (percentualGeral >= 80) { nivel = "Alto Engajamento"; cor = "#27AE60"; }
  else if (percentualGeral >= 60) { nivel = "Engajamento Moderado"; cor = "#C9A84C"; }
  else if (percentualGeral >= 40) { nivel = "Baixo Engajamento"; cor = "#E67E22"; }
  else { nivel = "Desengajamento Crítico"; cor = "#C0392B"; }

  return {
    totalRespondentes: n,
    mediaGeral,
    percentualGeral,
    porDimensao,
    porPergunta: porPergunta.sort((a, b) => a.percentual - b.percentual),
    distribuicao: {
      alto: Math.round((distribuicao.alto / n) * 100),
      medio: Math.round((distribuicao.medio / n) * 100),
      baixo: Math.round((distribuicao.baixo / n) * 100),
    },
    nivel,
    cor,
  };
}

// ── GPTW ─────────────────────────────────────────────────────────

export type ConsolidadoGPTW = {
  totalRespondentes: number;
  trustIndexMedio: number; // 0-100
  porDimensao: Record<string, { media: number }>;
  porAfirmacao: { id: number; texto: string; dimensao: string; media: number; percentual: number }[];
  distribuicao: { alto: number; medio: number; baixo: number };
  nivel: string;
  cor: string;
};

export function consolidarGPTW(respostas: RespostaIndividual[]): ConsolidadoGPTW {
  const n = respostas.length;
  if (n === 0) throw new Error("Sem respostas para consolidar");

  const porAfirmacao = AFIRMACOES_GPTW.map((a) => {
    const vals = respostas.map((r) => r.respostas?.[a.id]).filter((v) => v != null) as number[];
    const media = vals.length > 0 ? vals.reduce((x, y) => x + y, 0) / vals.length : 0;
    const percentual = Math.round(((media - 1) / 4) * 100);
    return { id: a.id, texto: a.texto, dimensao: a.dimensao, media, percentual };
  });

  const dims = ["Credibilidade", "Respeito", "Imparcialidade", "Orgulho", "Camaradagem"];
  const porDimensao: Record<string, { media: number }> = {};
  for (const dim of dims) {
    const as = porAfirmacao.filter((a) => a.dimensao === dim);
    const media = as.reduce((x, a) => x + a.percentual, 0) / as.length;
    porDimensao[dim] = { media: Math.round(media) };
  }

  const trustIndexMedio = Math.round(
    Object.values(porDimensao).reduce((a, b) => a + b.media, 0) / dims.length
  );

  const distribuicao = { alto: 0, medio: 0, baixo: 0 };
  for (const r of respostas) {
    const ti = (r.resultado as Record<string, number>)?.trustIndex ?? 0;
    if (ti >= 70) distribuicao.alto++;
    else if (ti >= 40) distribuicao.medio++;
    else distribuicao.baixo++;
  }

  let nivel: string, cor: string;
  if (trustIndexMedio >= 80) { nivel = "Cultura de Alto Desempenho"; cor = "#27AE60"; }
  else if (trustIndexMedio >= 65) { nivel = "Boa Cultura"; cor = "#C9A84C"; }
  else if (trustIndexMedio >= 50) { nivel = "Cultura em Desenvolvimento"; cor = "#E67E22"; }
  else { nivel = "Cultura em Risco"; cor = "#C0392B"; }

  return {
    totalRespondentes: n,
    trustIndexMedio,
    porDimensao,
    porAfirmacao: porAfirmacao.sort((a, b) => a.percentual - b.percentual),
    distribuicao: {
      alto: Math.round((distribuicao.alto / n) * 100),
      medio: Math.round((distribuicao.medio / n) * 100),
      baixo: Math.round((distribuicao.baixo / n) * 100),
    },
    nivel,
    cor,
  };
}
