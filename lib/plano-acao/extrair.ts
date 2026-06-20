export type ItemPlano = {
  dimensao: string;
  acao: string;
};

// ── Diagnóstico 3D ───────────────────────────────────────────────

const ACOES_3D: Record<string, Record<string, string[]>> = {
  clareza_proposito: {
    critico: ["Defina em uma frase o propósito da empresa e comunique ao time nas próximas 2 semanas.", "Agende uma sessão estratégica para alinhar visão de longo prazo com os sócios."],
    atencao: ["Revise o propósito existente com o time de liderança e valide se ainda reflete a direção real.", "Documente a visão de 3 anos com metas específicas e mensuráveis."],
  },
  planejamento_estrategico: {
    critico: ["Monte um planejamento estratégico trimestral com OKRs ou metas por área.", "Implante uma reunião mensal de revisão estratégica com os líderes."],
    atencao: ["Revise o planejamento atual e elimine iniciativas que não contribuem para a visão.", "Adicione indicadores de resultado a cada meta existente."],
  },
  gestao_kpis: {
    critico: ["Defina 3-5 KPIs críticos do negócio e crie um dashboard simples de acompanhamento.", "Implante uma rotina semanal de revisão dos indicadores com a liderança."],
    atencao: ["Automatize a coleta dos KPIs existentes para reduzir o esforço manual.", "Adicione metas numéricas aos indicadores que ainda não têm."],
  },
  rituais_gestao: {
    critico: ["Implante daily de 15 minutos com o time imediato.", "Crie uma agenda fixa de reuniões: daily, weekly e monthly."],
    atencao: ["Revise as reuniões existentes: elimine as desnecessárias e melhore a pauta das essenciais.", "Documente a ata de cada reunião estratégica com decisões e próximos passos."],
  },
  tomada_decisao: {
    critico: ["Defina quem tem autonomia para tomar quais decisões — crie uma matriz RACI simples.", "Identifique as 3 decisões que você não deveria mais tomar e delegue."],
    atencao: ["Reduza o tempo médio de decisão definindo um prazo máximo para cada tipo.", "Documente as principais decisões tomadas com o racional para criar memória organizacional."],
  },
  cultura_organizacional: {
    critico: ["Escreva os 3-5 valores inegociáveis da empresa com exemplos concretos de comportamento.", "Realize uma conversa aberta com o time sobre a cultura atual vs. a cultura desejada."],
    atencao: ["Avalie se as decisões de contratação e demissão refletem os valores declarados.", "Crie rituais que reforcem os valores no dia a dia."],
  },
  lideranca_pessoal: {
    critico: ["Identifique seu maior limitador de liderança e comprometa-se com uma ação de melhoria nos próximos 30 dias.", "Inicie um processo de mentoria ou coaching executivo."],
    atencao: ["Reserve 2 horas por semana para reflexão estratégica — proteja esse tempo.", "Solicite feedback estruturado de 3 pessoas próximas sobre seu estilo de liderança."],
  },
  desenvolvimento_time: {
    critico: ["Mapeie as lacunas de competência do time e crie um plano de desenvolvimento por pessoa.", "Implante 1-on-1s mensais com cada liderança direta."],
    atencao: ["Crie uma trilha de desenvolvimento para cada papel crítico da empresa.", "Implante feedbacks estruturados semestrais com planos de ação concretos."],
  },
  gestao_financeira: {
    critico: ["Implante um fluxo de caixa semanal com projeção de 13 semanas.", "Defina margens mínimas por produto/serviço e revise o pricing atual."],
    atencao: ["Crie um dashboard financeiro mensal com receita, margem e fluxo de caixa.", "Revise os 3 maiores centros de custo e identifique oportunidades de otimização."],
  },
  modelo_receita: {
    critico: ["Mapeie todas as fontes de receita e identifique qual tem maior margem e escalabilidade.", "Avalie se há concentração de receita em poucos clientes e crie um plano de diversificação."],
    atencao: ["Crie um modelo de previsão de receita para os próximos 3 meses.", "Identifique oportunidades de receita recorrente no modelo atual."],
  },
  processos_operacionais: {
    critico: ["Documente os 3 processos mais críticos da operação.", "Identifique o maior gargalo operacional e ataque primeiro."],
    atencao: ["Implante indicadores de eficiência operacional nos processos existentes.", "Avalie quais processos podem ser automatizados nos próximos 90 dias."],
  },
  escalabilidade: {
    critico: ["Identifique o que impede a empresa de dobrar de tamanho sem dobrar de custo.", "Mapeie as dependências do fundador na operação e crie plano de desatrelamento."],
    atencao: ["Documente o modelo de negócio atual e identifique os pontos de alavancagem.", "Avalie quais funções precisam ser estruturadas antes do próximo crescimento."],
  },
};

export function extrairAcoes3D(resultado: Record<string, unknown>): ItemPlano[] {
  const scores = resultado.scores as Record<string, number> ?? {};
  const itens: ItemPlano[] = [];

  const ordenados = Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 6);

  for (const [dim, score] of ordenados) {
    const zona = score < 4 ? "critico" : "atencao";
    const acoesDim = ACOES_3D[dim]?.[zona] ?? [];
    if (acoesDim[0]) itens.push({ dimensao: dim.replace(/_/g, " "), acao: acoesDim[0] });
  }

  return itens;
}

// ── Radar 360 ────────────────────────────────────────────────────

const ACOES_RADAR: Record<string, string[]> = {
  estrategia: ["Defina e documente a estratégia dos próximos 3 anos com metas e indicadores.", "Realize uma reunião estratégica trimestral com a liderança."],
  lideranca: ["Inicie um processo de desenvolvimento de liderança com foco nos gaps identificados.", "Implante 1-on-1s mensais com cada membro direto."],
  cultura: ["Escreva os valores inegociáveis da empresa com comportamentos concretos.", "Crie rituais que reforcem a cultura desejada no dia a dia."],
  gestao: ["Implante rituais de gestão: daily, weekly e revisão mensal de KPIs.", "Defina uma matriz de decisão para eliminar gargalos de aprovação."],
  processos: ["Documente os 3 processos mais críticos da operação.", "Implante métricas de eficiência nos processos existentes."],
  marketing: ["Defina o ICP (perfil de cliente ideal) e o posicionamento da empresa.", "Crie um calendário de conteúdo e ações de geração de demanda."],
  vendas: ["Documente o processo comercial e implante um CRM.", "Defina metas de vendas por produto/serviço e acompanhe semanalmente."],
  financeiro: ["Implante fluxo de caixa semanal com projeção de 13 semanas.", "Crie um dashboard financeiro mensal com receita, margem e caixa."],
};

export function extrairAcoesRadar360(resultado: Record<string, unknown>): ItemPlano[] {
  const scores = resultado.scores as Record<string, number> ?? {};
  const criticas = (resultado.zonaCritica as string[] ?? []);
  const atencao = (resultado.zonaAtencao as string[] ?? []);

  const prioritarias = [...criticas, ...atencao].slice(0, 6);
  return prioritarias.map((dim) => ({
    dimensao: dim,
    acao: ACOES_RADAR[dim]?.[0] ?? `Desenvolva ações para melhorar ${dim}.`,
  }));
}

// ── DISC ─────────────────────────────────────────────────────────

const ACOES_DISC: Record<string, string[]> = {
  D: [
    "Pratique escuta ativa antes de decidir — ouça o time até o fim antes de concluir.",
    "Comunique o 'porquê' das suas decisões para gerar adesão, não só obediência.",
    "Reserve tempo para ouvir perspectivas diferentes das suas.",
    "Calibre a velocidade: algumas decisões ganham com 24h de reflexão.",
  ],
  I: [
    "Estruture o acompanhamento de compromissos assumidos — use checklists.",
    "Equilibre entusiasmo com execução: defina prazos reais antes de comunicar projetos.",
    "Pratique a comunicação escrita para complementar sua força verbal.",
    "Foque em aprofundar poucas iniciativas antes de iniciar novas.",
  ],
  S: [
    "Pratique comunicação assertiva: expresse discordância de forma direta e respeitosa.",
    "Abrace mudanças como oportunidade — a resistência ao novo limita o seu crescimento.",
    "Estabeleça limites claros: aprender a dizer 'não' é um ato de liderança.",
    "Tome a iniciativa mesmo sem certeza absoluta.",
  ],
  C: [
    "Estabeleça critérios de 'bom o suficiente' antes de iniciar uma tarefa.",
    "Comunique mais e mais cedo: compartilhe o raciocínio antes de ter a resposta final.",
    "Pratique tomada de decisão com 70-80% das informações.",
    "Flexibilize processos quando o contexto exige.",
  ],
};

export function extrairAcoesDISC(resultado: Record<string, unknown>): ItemPlano[] {
  const perfil = resultado.perfilDominante as string ?? "D";
  return (ACOES_DISC[perfil] ?? []).map((acao) => ({
    dimensao: `Perfil ${perfil}`,
    acao,
  }));
}

// ── Q12 ──────────────────────────────────────────────────────────

const ACOES_Q12_DIM: Record<string, string[]> = {
  "Necessidades Básicas": [
    "Realize alinhamentos individuais para garantir clareza de papel e expectativas.",
    "Mapeie e elimine as principais fricções operacionais que o time enfrenta.",
  ],
  "Suporte Individual": [
    "Implante 1-on-1s mensais com foco em reconhecimento e desenvolvimento.",
    "Crie um plano de desenvolvimento individual para cada membro do time.",
  ],
  "Trabalho em Equipe": [
    "Comunique a missão e o impacto do trabalho de cada pessoa regularmente.",
    "Crie rituais de time: daily, retrospectiva e celebração de conquistas.",
  ],
  "Crescimento": [
    "Implante feedbacks estruturados semestrais com planos concretos.",
    "Crie pelo menos 1 oportunidade de aprendizado por trimestre.",
  ],
};

export function extrairAcoesQ12(resultado: Record<string, unknown>): ItemPlano[] {
  const porDimensao = resultado.porDimensao as Record<string, number> ?? {};
  return Object.entries(porDimensao)
    .sort(([, a], [, b]) => a - b)
    .flatMap(([dim]) =>
      (ACOES_Q12_DIM[dim] ?? []).map((acao) => ({ dimensao: dim, acao }))
    )
    .slice(0, 6);
}

// ── GPTW ─────────────────────────────────────────────────────────

const ACOES_GPTW_DIM: Record<string, string[]> = {
  Credibilidade: [
    "Realize reuniões mensais de comunicação com metas e desafios reais.",
    "Cumpra os compromissos assumidos — e comunique quando não puder.",
  ],
  Respeito: [
    "Inicie 1-on-1s mensais com cada pessoa do time.",
    "Reconheça publicamente o trabalho bem feito de forma específica.",
  ],
  Imparcialidade: [
    "Torne os critérios de promoção e reconhecimento explícitos e públicos.",
    "Crie um canal para reportar percepções de injustiça.",
  ],
  Orgulho: [
    "Conte histórias de impacto — como o trabalho mudou clientes reais.",
    "Conecte o trabalho individual ao propósito maior da empresa.",
  ],
  Camaradagem: [
    "Crie momentos de conexão não relacionados ao trabalho.",
    "Facilite o onboarding social de novos colaboradores.",
  ],
};

export function extrairAcoesGPTW(resultado: Record<string, unknown>): ItemPlano[] {
  const porDimensao = resultado.porDimensao as Record<string, number> ?? {};
  return Object.entries(porDimensao)
    .sort(([, a], [, b]) => a - b)
    .flatMap(([dim]) =>
      (ACOES_GPTW_DIM[dim] ?? []).map((acao) => ({ dimensao: dim, acao }))
    )
    .slice(0, 6);
}

// ── Canvas ────────────────────────────────────────────────────────

export function extrairAcoesCanvas(resultado: Record<string, unknown>): ItemPlano[] {
  const respostas = resultado.respostas as Record<string, string> ?? {};
  const DIMS: Record<string, string> = {
    proposito: "Propósito & Direção",
    mercado: "Mercado & Posicionamento",
    modelo: "Modelo de Negócio",
    gargalos: "Principais Gargalos",
    time: "Time & Liderança",
    proximo_movimento: "Próximo Movimento",
  };
  return Object.entries(DIMS)
    .filter(([id]) => (respostas[id] ?? "").trim().length > 0)
    .map(([id, label]) => ({
      dimensao: label,
      acao: `Revisar e agir sobre: "${(respostas[id] ?? "").slice(0, 120)}${(respostas[id] ?? "").length > 120 ? "..." : ""}"`,
    }));
}

// ── Rodada consolidada ───────────────────────────────────────────

export function extrairAcoesRodada(tipo: string, resultado: Record<string, unknown>): ItemPlano[] {
  if (tipo === "q12") return extrairAcoesQ12(resultado);
  if (tipo === "gptw") {
    const porDimensao = resultado.porDimensao as Record<string, { media: number }> ?? {};
    const mapped: Record<string, number> = {};
    for (const [k, v] of Object.entries(porDimensao)) mapped[k] = v.media;
    return extrairAcoesGPTW({ porDimensao: mapped });
  }
  return [];
}

// ── Entry point unificado ────────────────────────────────────────

export type TipoPlano =
  | "diagnostico_3d"
  | "radar_360"
  | "disc"
  | "q12"
  | "gptw"
  | "canvas_estrategico"
  | "rodada_q12"
  | "rodada_gptw";

export function extrairItensPlano(tipo: TipoPlano, resultado: Record<string, unknown>): ItemPlano[] {
  switch (tipo) {
    case "diagnostico_3d": return extrairAcoes3D(resultado);
    case "radar_360": return extrairAcoesRadar360(resultado);
    case "disc": return extrairAcoesDISC(resultado);
    case "q12": return extrairAcoesQ12(resultado);
    case "gptw": return extrairAcoesGPTW(resultado);
    case "canvas_estrategico": return extrairAcoesCanvas(resultado);
    case "rodada_q12": return extrairAcoesRodada("q12", resultado);
    case "rodada_gptw": return extrairAcoesRodada("gptw", resultado);
    default: return [];
  }
}
