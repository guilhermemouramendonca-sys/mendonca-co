export type Pergunta = {
  id: string;
  dimensao: "disciplina" | "direcao" | "dominio";
  subdimensao: string;
  texto: string;
};

export const PERGUNTAS: Pergunta[] = [
  // ─── DISCIPLINA ───────────────────────────────────────────
  // Consistência de execução
  { id: "D1a", dimensao: "disciplina", subdimensao: "Consistência de execução", texto: "Cumpro as metas e compromissos que estabeleço para mim mesmo com regularidade." },
  { id: "D1b", dimensao: "disciplina", subdimensao: "Consistência de execução", texto: "Minha equipe percebe coerência entre o que prometo e o que entrego." },
  { id: "D1c", dimensao: "disciplina", subdimensao: "Consistência de execução", texto: "Consigo manter o ritmo de execução mesmo em períodos de alta pressão." },
  // Gestão do tempo e prioridades
  { id: "D2a", dimensao: "disciplina", subdimensao: "Gestão do tempo e prioridades", texto: "Sei identificar e proteger as tarefas de maior impacto no meu dia." },
  { id: "D2b", dimensao: "disciplina", subdimensao: "Gestão do tempo e prioridades", texto: "Raramente deixo urgências alheias ditarem minha agenda." },
  { id: "D2c", dimensao: "disciplina", subdimensao: "Gestão do tempo e prioridades", texto: "Tenho clareza sobre o que devo delegar e o que devo fazer pessoalmente." },
  // Controle de hábitos e rotinas
  { id: "D3a", dimensao: "disciplina", subdimensao: "Controle de hábitos e rotinas", texto: "Tenho rotinas matinais e/ou noturnas que me preparam para alta performance." },
  { id: "D3b", dimensao: "disciplina", subdimensao: "Controle de hábitos e rotinas", texto: "Meus hábitos de saúde (sono, alimentação, exercício) sustentam minha energia." },
  { id: "D3c", dimensao: "disciplina", subdimensao: "Controle de hábitos e rotinas", texto: "Sou capaz de eliminar ou reduzir comportamentos que sabotam meus resultados." },
  // Resiliência e constância
  { id: "D4a", dimensao: "disciplina", subdimensao: "Resiliência e constância", texto: "Diante de fracassos, me recomponho rapidamente sem perder o foco." },
  { id: "D4b", dimensao: "disciplina", subdimensao: "Resiliência e constância", texto: "Mantenho a constância nos processos mesmo quando os resultados demoram a aparecer." },
  { id: "D4c", dimensao: "disciplina", subdimensao: "Resiliência e constância", texto: "Não desisto de metas importantes por conta de obstáculos intermediários." },

  // ─── DIREÇÃO ─────────────────────────────────────────────
  // Clareza de visão e propósito
  { id: "Dc1a", dimensao: "direcao", subdimensao: "Clareza de visão e propósito", texto: "Consigo articular com clareza para onde quero levar minha empresa nos próximos 3–5 anos." },
  { id: "Dc1b", dimensao: "direcao", subdimensao: "Clareza de visão e propósito", texto: "Meu time compreende e se conecta com o propósito do negócio." },
  { id: "Dc1c", dimensao: "direcao", subdimensao: "Clareza de visão e propósito", texto: "Tomo decisões alinhadas à visão de longo prazo, mesmo quando há pressão do curto prazo." },
  // Definição de metas e estratégia
  { id: "Dc2a", dimensao: "direcao", subdimensao: "Definição de metas e estratégia", texto: "As metas da empresa são específicas, mensuráveis e com prazos definidos." },
  { id: "Dc2b", dimensao: "direcao", subdimensao: "Definição de metas e estratégia", texto: "Tenho uma estratégia clara para atingir os objetivos do negócio." },
  { id: "Dc2c", dimensao: "direcao", subdimensao: "Definição de metas e estratégia", texto: "Revisamos regularmente as metas e ajustamos o plano conforme necessário." },
  // Tomada de decisão
  { id: "Dc3a", dimensao: "direcao", subdimensao: "Tomada de decisão", texto: "Tomo decisões importantes com base em dados e não apenas na intuição." },
  { id: "Dc3b", dimensao: "direcao", subdimensao: "Tomada de decisão", texto: "Consigo decidir com agilidade mesmo em situações de incerteza." },
  { id: "Dc3c", dimensao: "direcao", subdimensao: "Tomada de decisão", texto: "Assumo a responsabilidade pelas decisões que tomo, sem transferir a culpa." },
  // Alinhamento de time e cultura
  { id: "Dc4a", dimensao: "direcao", subdimensao: "Alinhamento de time e cultura", texto: "Os valores da empresa são praticados no dia a dia, não apenas declarados." },
  { id: "Dc4b", dimensao: "direcao", subdimensao: "Alinhamento de time e cultura", texto: "Meu time sabe exatamente o que se espera dele em termos de comportamento e entrega." },
  { id: "Dc4c", dimensao: "direcao", subdimensao: "Alinhamento de time e cultura", texto: "Tenho mecanismos para identificar e corrigir desalinhamentos culturais rapidamente." },

  // ─── DOMÍNIO ─────────────────────────────────────────────
  // Conhecimento técnico do negócio
  { id: "Do1a", dimensao: "dominio", subdimensao: "Conhecimento técnico do negócio", texto: "Domino os fundamentos técnicos do setor em que atuo." },
  { id: "Do1b", dimensao: "dominio", subdimensao: "Conhecimento técnico do negócio", texto: "Me mantenho atualizado sobre tendências e inovações do mercado." },
  { id: "Do1c", dimensao: "dominio", subdimensao: "Conhecimento técnico do negócio", texto: "Consigo identificar oportunidades de negócio antes de meus concorrentes." },
  // Liderança e influência
  { id: "Do2a", dimensao: "dominio", subdimensao: "Liderança e influência", texto: "As pessoas me seguem por inspiração, não apenas por hierarquia." },
  { id: "Do2b", dimensao: "dominio", subdimensao: "Liderança e influência", texto: "Consigo engajar e reter talentos mesmo em momentos desafiadores." },
  { id: "Do2c", dimensao: "dominio", subdimensao: "Liderança e influência", texto: "Desenvolvo líderes dentro da minha empresa continuamente." },
  // Gestão financeira
  { id: "Do3a", dimensao: "dominio", subdimensao: "Gestão financeira", texto: "Conheço com precisão os indicadores financeiros do meu negócio (margem, fluxo de caixa, EBITDA)." },
  { id: "Do3b", dimensao: "dominio", subdimensao: "Gestão financeira", texto: "Tomo decisões de investimento com base em projeções e análise de risco." },
  { id: "Do3c", dimensao: "dominio", subdimensao: "Gestão financeira", texto: "A saúde financeira do negócio é monitorada com regularidade e transparência." },
  // Processos e sistemas
  { id: "Do4a", dimensao: "dominio", subdimensao: "Processos e sistemas", texto: "Os principais processos da empresa estão documentados e são seguidos." },
  { id: "Do4b", dimensao: "dominio", subdimensao: "Processos e sistemas", texto: "Utilizamos tecnologia e sistemas para ganhar eficiência operacional." },
  { id: "Do4c", dimensao: "dominio", subdimensao: "Processos e sistemas", texto: "A empresa funciona bem mesmo quando não estou presente." },
];

export type Resultado = {
  scores: {
    disciplina: number;
    direcao: number;
    dominio: number;
  };
  subdimensoes: Record<string, number>;
  geral: number;
};

export function calcularResultado(respostas: Record<string, number>): Resultado {
  const subdimensoes: Record<string, number[]> = {};

  for (const p of PERGUNTAS) {
    const val = respostas[p.id];
    if (val !== undefined) {
      if (!subdimensoes[p.subdimensao]) subdimensoes[p.subdimensao] = [];
      subdimensoes[p.subdimensao].push(val);
    }
  }

  const mediaSubdim: Record<string, number> = {};
  for (const [k, vals] of Object.entries(subdimensoes)) {
    mediaSubdim[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function mediaDimensao(dim: string): number {
    const pergs = PERGUNTAS.filter((p) => p.dimensao === dim);
    const vals = pergs.map((p) => respostas[p.id]).filter((v) => v !== undefined);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  const disciplina = mediaDimensao("disciplina");
  const direcao = mediaDimensao("direcao");
  const dominio = mediaDimensao("dominio");
  const geral = (disciplina + direcao + dominio) / 3;

  return { scores: { disciplina, direcao, dominio }, subdimensoes: mediaSubdim, geral };
}

export function faixaScore(score: number): { label: string; cor: string; descricao: string } {
  if (score >= 8) return { label: "Zona de Excelência", cor: "#2D6A4F", descricao: "Manter e expandir" };
  if (score >= 6) return { label: "Zona de Competência", cor: "#C9A84C", descricao: "Consolidar" };
  if (score >= 4) return { label: "Zona de Atenção", cor: "#E9C46A", descricao: "Desenvolver ativamente" };
  return { label: "Zona Crítica", cor: "#C1121F", descricao: "Prioridade imediata" };
}
