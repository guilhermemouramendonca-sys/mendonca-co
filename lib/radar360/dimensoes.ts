export type DimensaoId =
  | "estrategia" | "lideranca" | "cultura" | "gestao"
  | "processos" | "marketing" | "vendas" | "financeiro";

export type PerguntaRadar = {
  id: string;
  dimensaoId: DimensaoId;
  nivel: "Estratégico" | "Tático" | "Operacional";
  corHex: string;
  pergunta: string;
  ancora1: string;
  ancora5: string;
};

export const PERGUNTAS_RADAR: PerguntaRadar[] = [
  // ── ESTRATÉGIA ───────────────────────────────────────────────
  { id: "estrategia_E", dimensaoId: "estrategia", nivel: "Estratégico", corHex: "#0D2B2E",
    pergunta: "Sua empresa tem uma visão de longo prazo clara e documentada?",
    ancora1: "Sem visão definida. Reagimos ao que aparece.",
    ancora5: "Visão de 3–5 anos, comunicada ao time e revisada regularmente." },
  { id: "estrategia_T", dimensaoId: "estrategia", nivel: "Tático", corHex: "#0D2B2E",
    pergunta: "As metas estratégicas estão desdobradas em planos trimestrais?",
    ancora1: "Sem metas formais. Cada área age por conta.",
    ancora5: "OKRs trimestrais conhecidos por todos e revisados mensalmente." },
  { id: "estrategia_O", dimensaoId: "estrategia", nivel: "Operacional", corHex: "#0D2B2E",
    pergunta: "O planejamento estratégico orienta as decisões do dia a dia?",
    ancora1: "Estratégia no papel, operação no improviso.",
    ancora5: "Cada decisão operacional é avaliada com base nas metas estratégicas." },

  // ── LIDERANÇA ────────────────────────────────────────────────
  { id: "lideranca_E", dimensaoId: "lideranca", nivel: "Estratégico", corHex: "#C9A84C",
    pergunta: "Há um pipeline de liderança sendo desenvolvido na empresa?",
    ancora1: "Tudo depende de mim. Sem sucessores preparados.",
    ancora5: "Líderes de segundo nível prontos e em crescimento contínuo." },
  { id: "lideranca_T", dimensaoId: "lideranca", nivel: "Tático", corHex: "#C9A84C",
    pergunta: "Qual é o nível de autonomia do seu time de liderança?",
    ancora1: "Todas as decisões passam por mim. Time só executa.",
    ancora5: "Líderes decidem, resolvem e respondem por resultados." },
  { id: "lideranca_O", dimensaoId: "lideranca", nivel: "Operacional", corHex: "#C9A84C",
    pergunta: "Feedbacks e 1-on-1s com líderes acontecem com regularidade?",
    ancora1: "Sem feedbacks estruturados. Líderes isolados.",
    ancora5: "1-on-1 semanal e plano de desenvolvimento por líder." },

  // ── CULTURA ──────────────────────────────────────────────────
  { id: "cultura_E", dimensaoId: "cultura", nivel: "Estratégico", corHex: "#8E44AD",
    pergunta: "Os valores da empresa guiam comportamentos reais e decisões?",
    ancora1: "Valores no papel. Comportamentos tóxicos tolerados.",
    ancora5: "Valores vividos diariamente e usados em decisões de RH." },
  { id: "cultura_T", dimensaoId: "cultura", nivel: "Tático", corHex: "#8E44AD",
    pergunta: "Existe um código de cultura documentado e compartilhado com o time?",
    ancora1: "Cultura implícita, nunca formalizada.",
    ancora5: "Código de cultura ativo, onboarding cultural estruturado." },
  { id: "cultura_O", dimensaoId: "cultura", nivel: "Operacional", corHex: "#8E44AD",
    pergunta: "Rituais culturais são praticados consistentemente no dia a dia?",
    ancora1: "Nenhum ritual cultural instalado.",
    ancora5: "3+ rituais semanais que reforçam os valores ativamente." },

  // ── GESTÃO ───────────────────────────────────────────────────
  { id: "gestao_E", dimensaoId: "gestao", nivel: "Estratégico", corHex: "#2980B9",
    pergunta: "O modelo de gestão da empresa é padronizado e replicável?",
    ancora1: "Cada área gere do jeito que quer. Sem padrão.",
    ancora5: "Modelo de gestão documentado, ensinado e praticado." },
  { id: "gestao_T", dimensaoId: "gestao", nivel: "Tático", corHex: "#2980B9",
    pergunta: "Os KPIs principais são conhecidos e acompanhados regularmente?",
    ancora1: "Sem métricas definidas. Gestão por feeling.",
    ancora5: "3–5 KPIs por área, revisados em reunião semanal." },
  { id: "gestao_O", dimensaoId: "gestao", nivel: "Operacional", corHex: "#2980B9",
    pergunta: "As reuniões de resultado são produtivas e acontecem com frequência?",
    ancora1: "Sem reuniões de resultado estruturadas.",
    ancora5: "Reuniões fixas com pauta, métricas e decisões documentadas." },

  // ── PROCESSOS ────────────────────────────────────────────────
  { id: "processos_E", dimensaoId: "processos", nivel: "Estratégico", corHex: "#E67E22",
    pergunta: "Os processos críticos do negócio estão mapeados e documentados?",
    ancora1: "Tudo na cabeça de quem executa. Sem documentação.",
    ancora5: "Processos críticos documentados, revisados e atualizados." },
  { id: "processos_T", dimensaoId: "processos", nivel: "Tático", corHex: "#E67E22",
    pergunta: "Os processos têm indicadores de qualidade, prazo e responsável?",
    ancora1: "Sem KPIs de processo. Reação a problemas.",
    ancora5: "Cada processo tem SLA, taxa de erro e dono definido." },
  { id: "processos_O", dimensaoId: "processos", nivel: "Operacional", corHex: "#E67E22",
    pergunta: "A operação escala sem depender de uma única pessoa-chave?",
    ancora1: "A empresa para sem a pessoa certa presente.",
    ancora5: "Processos transferíveis. Novo colaborador aprende em dias." },

  // ── MARKETING ────────────────────────────────────────────────
  { id: "marketing_E", dimensaoId: "marketing", nivel: "Estratégico", corHex: "#C0392B",
    pergunta: "O posicionamento da empresa é claro e diferenciado no mercado?",
    ancora1: "Sem posicionamento definido. Serve a todos igualmente.",
    ancora5: "Nicho claro, proposta única e posição defensável no setor." },
  { id: "marketing_T", dimensaoId: "marketing", nivel: "Tático", corHex: "#C0392B",
    pergunta: "A empresa gera demanda previsível pelos canais de marketing?",
    ancora1: "Marketing inexistente ou sem resultado mensurável.",
    ancora5: "Canais ativos gerando leads qualificados mensalmente." },
  { id: "marketing_O", dimensaoId: "marketing", nivel: "Operacional", corHex: "#C0392B",
    pergunta: "O desempenho do marketing é medido com métricas regulares?",
    ancora1: "Sem métricas de marketing. Só intuição.",
    ancora5: "CAC, conversão e ROI por canal monitorados." },

  // ── VENDAS ───────────────────────────────────────────────────
  { id: "vendas_E", dimensaoId: "vendas", nivel: "Estratégico", corHex: "#27AE60",
    pergunta: "Existe um processo de vendas estruturado e replicável?",
    ancora1: "Vendas por indicação, sem método ou funil definido.",
    ancora5: "Processo documentado, replicável por qualquer vendedor." },
  { id: "vendas_T", dimensaoId: "vendas", nivel: "Tático", corHex: "#27AE60",
    pergunta: "A pipeline de vendas é monitorada com métricas e previsibilidade?",
    ancora1: "Sem CRM ou controle de oportunidades.",
    ancora5: "CRM atualizado com taxas de conversão por etapa e forecast." },
  { id: "vendas_O", dimensaoId: "vendas", nivel: "Operacional", corHex: "#27AE60",
    pergunta: "As reuniões de vendas geram ações e revisão de resultados?",
    ancora1: "Sem reunião de vendas estruturada.",
    ancora5: "Revisão semanal com forecast, prioridades e plano de ação." },

  // ── FINANCEIRO ───────────────────────────────────────────────
  { id: "financeiro_E", dimensaoId: "financeiro", nivel: "Estratégico", corHex: "#2D6A4F",
    pergunta: "A empresa tem visibilidade clara do resultado financeiro mensal?",
    ancora1: "Sem DRE. Receita e despesa desconhecidas.",
    ancora5: "DRE mensal, projeções e análise de margem por linha." },
  { id: "financeiro_T", dimensaoId: "financeiro", nivel: "Tático", corHex: "#2D6A4F",
    pergunta: "As decisões de investimento têm base financeira e ROI esperado?",
    ancora1: "Decisões sem análise de retorno ou custo.",
    ancora5: "Todo investimento tem ROI esperado e payback definido." },
  { id: "financeiro_O", dimensaoId: "financeiro", nivel: "Operacional", corHex: "#2D6A4F",
    pergunta: "O caixa e fluxo financeiro são monitorados regularmente?",
    ancora1: "Caixa desconhecido. Sempre no limite.",
    ancora5: "Fluxo projetado 90 dias à frente, atualizado semanalmente." },
];

export type ResultadoRadar360 = {
  scores: Record<DimensaoId, number>;
  geral: number;
  portaEntrada: "Estratégica" | "Liderança" | "Cultura" | "Gestão";
  zonaCritica: DimensaoId[];   // score 1-2
  zonaAtencao: DimensaoId[];   // score 3
  zonaForte: DimensaoId[];     // score 4-5
};

export const DIMENSOES: {
  id: DimensaoId;
  titulo: string;
  pergunta: string;
  ancora1: string;
  ancora5: string;
  corHex: string;
}[] = [
  {
    id: "estrategia",
    titulo: "Estratégia",
    pergunta: "Como você avalia a estratégia da sua empresa?",
    ancora1: "Nenhum plano formal. Decisões no improviso.",
    ancora5: "Plano claro, comunicado ao time e revisado com frequência.",
    corHex: "#0D2B2E",
  },
  {
    id: "lideranca",
    titulo: "Liderança",
    pergunta: "Qual é o nível de autonomia do seu time?",
    ancora1: "A empresa depende 100% de mim. Sem mim, ela para.",
    ancora5: "O time opera com autonomia. Consigo me afastar 30 dias.",
    corHex: "#C9A84C",
  },
  {
    id: "cultura",
    titulo: "Cultura",
    pergunta: "Como a cultura é vivida na sua empresa?",
    ancora1: "Valores não declarados. Comportamentos tóxicos tolerados.",
    ancora5: "Cultura forte e viva. Valores geram comportamento real.",
    corHex: "#8E44AD",
  },
  {
    id: "gestao",
    titulo: "Gestão",
    pergunta: "Como é o modelo de gestão da sua empresa?",
    ancora1: "Sem reuniões fixas, sem métricas, sem accountability.",
    ancora5: "Rituais instalados. Metas claras e time responsabilizado.",
    corHex: "#2980B9",
  },
  {
    id: "processos",
    titulo: "Processos",
    pergunta: "Como estão os processos críticos da empresa?",
    ancora1: "Tudo na cabeça de uma pessoa. Sem documentação.",
    ancora5: "Processos documentados, executados e revisados regularmente.",
    corHex: "#E67E22",
  },
  {
    id: "marketing",
    titulo: "Marketing",
    pergunta: "Como está o posicionamento e marketing da empresa?",
    ancora1: "Sem posicionamento claro. Marketing inexistente ou sem resultado.",
    ancora5: "Posicionamento claro. Marketing gera demanda previsível.",
    corHex: "#C0392B",
  },
  {
    id: "vendas",
    titulo: "Vendas",
    pergunta: "Como está o funil de vendas?",
    ancora1: "Vendas por indicação, sem funil estruturado.",
    ancora5: "Funil ativo, métricas claras e processo replicável.",
    corHex: "#27AE60",
  },
  {
    id: "financeiro",
    titulo: "Financeiro",
    pergunta: "Como é a gestão financeira da empresa?",
    ancora1: "Sem DRE. Decisões sem base financeira.",
    ancora5: "Margem e receita monitorados. Números usados para decidir.",
    corHex: "#2D6A4F",
  },
];

const PORTA_MAP: Record<DimensaoId, ResultadoRadar360["portaEntrada"]> = {
  estrategia: "Estratégica",
  lideranca:  "Liderança",
  cultura:    "Cultura",
  gestao:     "Gestão",
  processos:  "Gestão",
  marketing:  "Gestão",
  vendas:     "Gestão",
  financeiro: "Gestão",
};

export function calcularRadar360(respostas: Record<string, number>): ResultadoRadar360 {
  const scores = {} as Record<DimensaoId, number>;
  for (const d of DIMENSOES) {
    const pergs = PERGUNTAS_RADAR.filter((p) => p.dimensaoId === d.id);
    const vals = pergs.map((p) => respostas[p.id] ?? 1);
    scores[d.id] = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
  }

  const geral = parseFloat(
    (Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSOES.length).toFixed(2)
  );

  // Porta de entrada = dimensão com menor score
  const minDim = (Object.entries(scores) as [DimensaoId, number][])
    .sort((a, b) => a[1] - b[1])[0][0];
  const portaEntrada = PORTA_MAP[minDim];

  const zonaCritica = (Object.entries(scores) as [DimensaoId, number][])
    .filter(([, v]) => v <= 2).map(([k]) => k);
  const zonaAtencao = (Object.entries(scores) as [DimensaoId, number][])
    .filter(([, v]) => v === 3).map(([k]) => k);
  const zonaForte = (Object.entries(scores) as [DimensaoId, number][])
    .filter(([, v]) => v >= 4).map(([k]) => k);

  return { scores, geral, portaEntrada, zonaCritica, zonaAtencao, zonaForte };
}

export function corScore(score: number): string {
  if (score >= 4) return "#2D6A4F";
  if (score === 3) return "#C9A84C";
  if (score === 2) return "#E67E22";
  return "#C0392B";
}

export function labelScore(score: number): string {
  if (score >= 5) return "Excelência";
  if (score >= 4) return "Competência";
  if (score === 3) return "Atenção";
  if (score === 2) return "Crítico";
  return "Crítico Urgente";
}

// Ações específicas por dimensão e score
export const ACOES_RADAR: Record<DimensaoId, Record<string, string[]>> = {
  estrategia: {
    critico: [
      "Reserve 2h com os sócios esta semana para responder: onde queremos estar em 3 anos? Documente em 1 parágrafo.",
      "Defina 1 objetivo estratégico para os próximos 90 dias com 2-3 indicadores mensuráveis.",
    ],
    atencao: [
      "Formalize o plano estratégico em documento único com visão, metas e KPIs.",
      "Apresente o plano para o time — estratégia que ninguém conhece é só intenção.",
    ],
    forte: [
      "Implemente revisão trimestral do plano com o time sênior fora do escritório.",
      "Conecte o planejamento ao BSC: perspectivas financeira, cliente, processos e pessoas.",
    ],
  },
  lideranca: {
    critico: [
      "Mapeie as 5 decisões que só você toma. Comece a transferir pelo menos 2 esta semana.",
      "Agende 1-on-1 mensais com cada líder direto: o que precisa? O que trava?",
    ],
    atencao: [
      "Defina quais decisões cada líder pode tomar sozinho. Documente e comunique ao time.",
      "Desenvolva 2-3 talentos com mentoria estruturada e projetos com autonomia crescente.",
    ],
    forte: [
      "Teste: a empresa consegue operar 30 dias sem você? Se não, construir isso é a próxima prioridade.",
      "Construa uma pipeline de liderança: sucessão, desenvolvimento e retenção de talentos-chave.",
    ],
  },
  cultura: {
    critico: [
      "Identifique e elimine o comportamento mais tóxico tolerado na empresa hoje.",
      "Escreva em 1 parágrafo: quem somos e o que nunca faremos. Compartilhe com o time.",
    ],
    atencao: [
      "Construa o código de cultura: propósito, valores com comportamentos observáveis, tolerância zero.",
      "Crie 3 rituais culturais que reforcem os valores no dia a dia.",
    ],
    forte: [
      "Incorpore a cultura ao processo seletivo: o que desclassifica culturalmente um candidato?",
      "Construa onboarding cultural: novos colaboradores vivem os valores desde o dia 1.",
    ],
  },
  gestao: {
    critico: [
      "Implemente a reunião semanal de resultado: 60 min, scoreboard de KPIs, issues, decisões.",
      "Defina 3 KPIs que você acompanha toda semana. Se não souber de cabeça, há KPIs demais.",
    ],
    atencao: [
      "Estruture o modelo de gestão: quem decide o quê, como se mede resultado, como se governa.",
      "Adicione o check diário de prioridades: 15 min para cada líder revisar o que importa.",
    ],
    forte: [
      "Automatize o scoreboard de KPIs — dados em tempo real, sem planilhas manuais.",
      "Ensine o modelo de gestão para os líderes. Eles precisam conduzir sem você.",
    ],
  },
  processos: {
    critico: [
      "Mapeie os 3 processos mais críticos. Documente o mais importante esta semana em 1 página.",
      "Identifique o maior gargalo operacional e elimine ou delegue em 30 dias.",
    ],
    atencao: [
      "Crie SOPs para os processos recorrentes: qualquer pessoa deve conseguir executar.",
      "Implemente KPIs operacionais: tempo de ciclo, taxa de erro, capacidade por processo.",
    ],
    forte: [
      "Revise processos trimestralmente — o que funciona em 10 pessoas muda em 50.",
      "Automatize tarefas repetitivas para liberar o time para atividades de maior valor.",
    ],
  },
  marketing: {
    critico: [
      "Responda em 1 frase: qual cliente choraria nossa ausência se fechássemos amanhã?",
      "Defina seu posicionamento: a quem servimos, como vencemos e o que não fazemos.",
    ],
    atencao: [
      "Crie uma presença digital consistente: LinkedIn ativo com conteúdo de posicionamento semanal.",
      "Mapeie a jornada do cliente: como nos descobrem, como decidem, como indicam.",
    ],
    forte: [
      "Meça o marketing: custo de aquisição (CAC) e retorno por canal.",
      "Posicione o fundador como referência no setor — autoridade pessoal é o ativo mais valioso.",
    ],
  },
  vendas: {
    critico: [
      "Mapeie seu processo de vendas: do primeiro contato ao fechamento. Quantas etapas? Qual conversão?",
      "Defina um ICP (Perfil de Cliente Ideal): quem você busca ativamente, não só quem aparece.",
    ],
    atencao: [
      "Implemente um CRM simples com pipeline visual. Negociação fora do CRM não existe.",
      "Crie um roteiro de qualificação: 5 perguntas que toda venda deve responder antes de avançar.",
    ],
    forte: [
      "Meça os 3 KPIs de vendas: leads, taxa de conversão e ticket médio. Revise semanalmente.",
      "Construa expansão de carteira: upsell, cross-sell e programa de indicação estruturado.",
    ],
  },
  financeiro: {
    critico: [
      "Saiba de cabeça agora: faturamento do mês, principal custo fixo, caixa positivo ou negativo.",
      "Implemente um DRE mensal simples. Se não tem contador, use planilha — mas tenha os números.",
    ],
    atencao: [
      "Conheça sua margem de contribuição por produto/serviço. Qual linha gera mais valor real?",
      "Crie um orçamento anual e compare realizado vs. planejado mensalmente.",
    ],
    forte: [
      "Monitore indicadores avançados: LTV, CAC, churn — métricas que antecipam o futuro.",
      "Implante governança financeira: políticas de aprovação e relatórios periódicos para sócios.",
    ],
  },
};

export function getAcoesRadar(dim: DimensaoId, score: number): string[] {
  const nivel = score >= 4 ? "forte" : score === 3 ? "atencao" : "critico";
  return ACOES_RADAR[dim][nivel];
}
