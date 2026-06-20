// Health Score: 0–100 calculado a partir de múltiplos sinais do cliente
// Pesos definidos por dimensão de relacionamento

export type DimensaoScore = {
  nome: string;
  peso: number;       // % do score total
  pontos: number;     // 0–100 nessa dimensão
  detalhe: string;
};

export type HealthScore = {
  total: number;              // 0–100
  nivel: "saudavel" | "atencao" | "risco";
  cor: string;
  dimensoes: DimensaoScore[];
  alertas: string[];
};

export type ClienteRaw = {
  id: string;
  nome: string;
  status: string;
  data_inicio_contrato?: string;
  // joins
  sessoes?: { data: string }[];
  cobrancas?: { status: string; vencimento: string }[];
  diagnosticos?: { criado_em: string }[];
  radar360?: { criado_em: string }[];
  pesquisas?: { criado_em: string }[];
  plano_acao_itens?: { status: string }[];
};

function diasDesde(data: string): number {
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
}

export function calcularHealthScore(c: ClienteRaw): HealthScore {
  const alertas: string[] = [];
  const dimensoes: DimensaoScore[] = [];

  // ── 1. Engajamento (25%) — baseado em sessões recentes ──────
  const sessoes = c.sessoes ?? [];
  const ultimaSessao = sessoes.length > 0
    ? Math.min(...sessoes.map((s) => diasDesde(s.data)))
    : 999;
  let engajamento = 0;
  if (ultimaSessao <= 30) engajamento = 100;
  else if (ultimaSessao <= 60) engajamento = 70;
  else if (ultimaSessao <= 90) engajamento = 40;
  else if (ultimaSessao <= 180) engajamento = 10;
  else engajamento = 0;

  if (ultimaSessao > 60) alertas.push(`Sem sessão há ${ultimaSessao} dias`);
  dimensoes.push({ nome: "Engajamento", peso: 25, pontos: engajamento, detalhe: sessoes.length === 0 ? "Sem sessões" : `Última há ${ultimaSessao}d` });

  // ── 2. Saúde financeira (25%) — cobranças em dia ────────────
  const cobrancas = c.cobrancas ?? [];
  const vencidas = cobrancas.filter(
    (cb) => cb.status === "pendente" && diasDesde(cb.vencimento) > 0
  ).length;
  const total = cobrancas.length;
  let financeiro = 100;
  if (total > 0) {
    const pctVencido = vencidas / total;
    if (pctVencido === 0) financeiro = 100;
    else if (pctVencido <= 0.25) financeiro = 60;
    else if (pctVencido <= 0.5) financeiro = 30;
    else financeiro = 0;
  }
  if (vencidas > 0) alertas.push(`${vencidas} cobrança${vencidas > 1 ? "s" : ""} vencida${vencidas > 1 ? "s" : ""}`);
  dimensoes.push({ nome: "Financeiro", peso: 25, pontos: financeiro, detalhe: total === 0 ? "Sem cobranças" : `${vencidas}/${total} vencida${vencidas !== 1 ? "s" : ""}` });

  // ── 3. Ferramentas aplicadas (25%) ──────────────────────────
  const diags = (c.diagnosticos ?? []).length;
  const radars = (c.radar360 ?? []).length;
  const pesqs = (c.pesquisas ?? []).length;
  const totalFerr = diags + radars + pesqs;
  let ferramentas = 0;
  if (totalFerr >= 4) ferramentas = 100;
  else if (totalFerr === 3) ferramentas = 80;
  else if (totalFerr === 2) ferramentas = 55;
  else if (totalFerr === 1) ferramentas = 30;
  else ferramentas = 0;

  if (totalFerr === 0) alertas.push("Nenhuma ferramenta aplicada ainda");
  dimensoes.push({ nome: "Ferramentas", peso: 25, pontos: ferramentas, detalhe: `${totalFerr} aplicação${totalFerr !== 1 ? "ões" : ""}` });

  // ── 4. Plano de ação (25%) ───────────────────────────────────
  const itens = c.plano_acao_itens ?? [];
  const concluidos = itens.filter((i) => i.status === "concluido").length;
  const pendentes = itens.filter((i) => i.status !== "concluido").length;
  let plano = 0;
  if (itens.length === 0) {
    plano = 50; // neutro — sem plano não penaliza totalmente
  } else {
    plano = Math.round((concluidos / itens.length) * 100);
  }
  if (itens.length > 0 && pendentes > 5) alertas.push(`${pendentes} itens do plano de ação pendentes`);
  dimensoes.push({ nome: "Plano de Ação", peso: 25, pontos: plano, detalhe: itens.length === 0 ? "Sem plano" : `${concluidos}/${itens.length} concluídos` });

  // ── Score final ponderado ─────────────────────────────────────
  const total_score = Math.round(
    dimensoes.reduce((acc, d) => acc + (d.pontos * d.peso) / 100, 0)
  );

  const nivel: HealthScore["nivel"] =
    total_score >= 70 ? "saudavel" : total_score >= 40 ? "atencao" : "risco";
  const cor = nivel === "saudavel" ? "#16A34A" : nivel === "atencao" ? "#D97706" : "#DC2626";

  return { total: total_score, nivel, cor, dimensoes, alertas };
}
