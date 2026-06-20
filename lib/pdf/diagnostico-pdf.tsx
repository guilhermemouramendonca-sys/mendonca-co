import {
  Document, Page, Text, View, StyleSheet,
  Svg, Polygon, Line, Circle,
} from "@react-pdf/renderer";
import type { Resultado } from "@/lib/diagnostico/perguntas";
import { faixaScore } from "@/lib/diagnostico/perguntas";

const CORES = {
  primary: "#0D2B2E", gold: "#C9A84C", goldLight: "#E8D5A3",
  bg: "#F5F0E8", text: "#1A1A1A", muted: "#6B6B6B",
  success: "#2D6A4F", warning: "#E9C46A", danger: "#C1121F", white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { backgroundColor: CORES.white, fontFamily: "Helvetica", padding: 0 },
  capa: { backgroundColor: CORES.primary, flex: 1, padding: 60, justifyContent: "space-between" },
  capaTitle: { color: CORES.gold, fontSize: 36, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  capaSubtitle: { color: CORES.goldLight, fontSize: 14, opacity: 0.8 },
  capaLinha: { width: 60, height: 2, backgroundColor: CORES.gold, marginVertical: 24 },
  capaNome: { color: CORES.white, fontSize: 22, fontFamily: "Helvetica-Bold" },
  capaData: { color: CORES.goldLight, fontSize: 11, marginTop: 6, opacity: 0.7 },
  capaRodape: { color: CORES.goldLight, fontSize: 10, opacity: 0.5 },
  pagina: { padding: 50, flex: 1 },
  secaoTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 6 },
  secaoSub: { fontSize: 11, color: CORES.muted, marginBottom: 20 },
  scoreBox: { backgroundColor: CORES.bg, borderRadius: 8, padding: 20, alignItems: "center", marginBottom: 20 },
  scoreNum: { fontSize: 52, fontFamily: "Helvetica-Bold", color: CORES.primary },
  scoreFaixa: { fontSize: 13, marginTop: 4 },
  dimRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  dimCard: { flex: 1, backgroundColor: CORES.bg, borderRadius: 8, padding: 14 },
  dimLabel: { fontSize: 9, color: CORES.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  dimScore: { fontSize: 26, fontFamily: "Helvetica-Bold", color: CORES.primary },
  dimFaixa: { fontSize: 9, marginTop: 2 },
  barraContainer: { marginBottom: 10 },
  barraLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  barraLabelText: { fontSize: 10, color: CORES.text },
  barraLabelScore: { fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary },
  barraBg: { height: 7, backgroundColor: "#E8D5A3", borderRadius: 4 },
  barraFill: { height: 7, borderRadius: 4 },
  analiseBox: { backgroundColor: CORES.bg, borderRadius: 8, padding: 14, marginBottom: 14 },
  analiseTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 6 },
  analiseText: { fontSize: 10, color: CORES.text, lineHeight: 1.6 },
  rodape: { position: "absolute", bottom: 24, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between" },
  rodapeText: { fontSize: 9, color: CORES.muted },
  passoItem: { flexDirection: "row", gap: 10, marginBottom: 10 },
  passoBullet: { width: 20, height: 20, borderRadius: 10, backgroundColor: CORES.gold, alignItems: "center", justifyContent: "center" },
  passoBulletText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: CORES.primary },
  passoText: { flex: 1, fontSize: 10, color: CORES.text, lineHeight: 1.6, paddingTop: 2 },
});

const DIMENSAO_LABELS: Record<string, string> = {
  disciplina: "Disciplina", direcao: "Direção", dominio: "Domínio",
};

const SUBDIM_POR_DIM: Record<string, string[]> = {
  disciplina: ["Consistência de execução", "Gestão do tempo e prioridades", "Controle de hábitos e rotinas", "Resiliência e constância"],
  direcao: ["Clareza de visão e propósito", "Definição de metas e estratégia", "Tomada de decisão", "Alinhamento de time e cultura"],
  dominio: ["Conhecimento técnico do negócio", "Liderança e influência", "Gestão financeira", "Processos e sistemas"],
};

// ── RADAR CHART SVG ─────────────────────────────────────────
const CX = 150, CY = 120, R = 85;

function radarPt(axis: number, norm: number) {
  const angle = -Math.PI / 2 + axis * (2 * Math.PI / 3);
  return { x: CX + R * norm * Math.cos(angle), y: CY + R * norm * Math.sin(angle) };
}

function pts(scores: number[]) {
  return scores.map((s, i) => radarPt(i, s / 10)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function gridPts(norm: number) {
  return [0, 1, 2].map((i) => radarPt(i, norm)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function RadarChart({ scores }: { scores: [number, number, number] }) {
  const s = scores.map((v) => v / 10);
  const corDim = scores.map((v) => faixaScore(v).cor);
  const scorePos = scores.map((_, i) => radarPt(i, s[i]));
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const axesTips = [0, 1, 2].map((i) => radarPt(i, 1.0));

  // Dominant color based on average
  const avg = scores.reduce((a, b) => a + b, 0) / 3;
  const fillColor = faixaScore(avg).cor;

  return (
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <Svg width={300} height={240} viewBox="0 0 300 240">
        {/* Grid polygons */}
        {gridLevels.map((lv, i) => (
          <Polygon
            key={i}
            points={gridPts(lv)}
            fill="none"
            stroke={lv === 1.0 ? CORES.goldLight : "#E8D5A3"}
            strokeWidth={lv === 1.0 ? 1.5 : 0.7}
            strokeDasharray={lv < 1.0 ? "3 3" : "0"}
          />
        ))}

        {/* Axes */}
        {axesTips.map((tip, i) => (
          <Line
            key={i}
            x1={CX} y1={CY}
            x2={tip.x} y2={tip.y}
            stroke={CORES.goldLight}
            strokeWidth={1}
          />
        ))}

        {/* Score polygon */}
        <Polygon
          points={pts(scores)}
          fill={fillColor + "30"}
          stroke={fillColor}
          strokeWidth={2}
        />

        {/* Score dots */}
        {scorePos.map((p, i) => (
          <Circle
            key={i}
            cx={p.x} cy={p.y} r={4}
            fill={corDim[i]}
            stroke={CORES.white}
            strokeWidth={1.5}
          />
        ))}

        {/* Center dot */}
        <Circle cx={CX} cy={CY} r={3} fill={CORES.muted} />
      </Svg>

      {/* Labels fora do SVG (react-pdf Text não funciona bem dentro de SVG) */}
      <View style={{ position: "absolute", top: 4, left: 0, right: 0, alignItems: "center" }}>
        {/* Disciplina — topo */}
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: corDim[0], position: "absolute", top: -4, left: 123 }}>
          Disciplina
        </Text>
        {/* Direção — baixo direita */}
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: corDim[1], position: "absolute", top: 193, left: 190 }}>
          Direção
        </Text>
        {/* Domínio — baixo esquerda */}
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: corDim[2], position: "absolute", top: 193, left: 58 }}>
          Domínio
        </Text>
        {/* Scores nas pontas */}
        {scorePos.map((p, i) => {
          const offsetX = i === 0 ? 126 : i === 1 ? p.x + 138 : p.x - 18;
          const offsetY = i === 0 ? p.y + 12 : p.y - 20;
          return (
            <Text key={i} style={{ fontSize: 8, color: corDim[i], position: "absolute", top: offsetY, left: offsetX }}>
              {scores[i].toFixed(1)}
            </Text>
          );
        })}
        {/* Grid labels */}
        <Text style={{ fontSize: 7, color: CORES.muted, position: "absolute", top: 100, left: 152 }}>5</Text>
        <Text style={{ fontSize: 7, color: CORES.muted, position: "absolute", top: 57, left: 152 }}>7.5</Text>
        <Text style={{ fontSize: 7, color: CORES.muted, position: "absolute", top: 142, left: 152 }}>2.5</Text>
      </View>
    </View>
  );
}

// ── TEXTOS DE ANÁLISE ────────────────────────────────────────
function analiseTexto(dim: string, score: number): string {
  const textos: Record<string, Record<string, string>> = {
    disciplina: {
      excelencia: "Sua disciplina é um diferencial competitivo. Você demonstra consistência na execução, gestão eficaz do tempo e hábitos que sustentam alta performance. O desafio agora é replicar esses padrões na equipe.",
      competencia: "Você possui boas bases de disciplina, mas há oportunidade de fortalecer a consistência entre intenção e execução. Foque em sistemas que reduzam a dependência da força de vontade.",
      atencao: "A disciplina é uma área que merece atenção ativa. Gaps na consistência de execução e gestão de tempo podem limitar seus resultados. Pequenas mudanças de rotina geram grande impacto aqui.",
      critico: "Esta é uma área prioritária para desenvolvimento imediato. A falta de disciplina sistêmica pode comprometer toda a estratégia. Recomendamos começar com uma única rotina de alto impacto.",
    },
    direcao: {
      excelencia: "Você lidera com clareza de visão e decisões alinhadas ao longo prazo. Seu time sabe para onde vai e por quê. O próximo nível é criar mecanismos que perpetuem essa direção além da sua presença.",
      competencia: "A direção estratégica está presente, mas pode ser mais sólida. Revisar metas, fortalecer o processo decisório e alinhar cultura são alavancas disponíveis para você agora.",
      atencao: "Há necessidade de maior clareza estratégica. Sem direção bem definida, o time tende a otimizar localmente em vez de globalmente. Priorize definir e comunicar a visão com mais precisão.",
      critico: "A ausência de direção clara é um risco imediato ao negócio. Decisões dispersas e falta de alinhamento cultural podem gerar retrabalho e perda de talentos. Este é o ponto de partida.",
    },
    dominio: {
      excelencia: "Seu domínio técnico e de gestão é uma vantagem competitiva clara. Você lidera com autoridade, conhece os números e tem processos funcionando. O desafio é escalar esse domínio via líderes.",
      competencia: "Você domina bem os fundamentos do negócio. Há espaço para aprofundar a gestão financeira e fortalecer os processos para que a empresa opere com mais independência da sua presença.",
      atencao: "Algumas áreas do domínio técnico e de gestão precisam de desenvolvimento. Lacunas em financeiro ou processos podem criar gargalos operacionais. Busque mentoria especializada nestas áreas.",
      critico: "O domínio técnico e de gestão requer atenção urgente. Sem clareza nos números, processos definidos e liderança de influência, o crescimento sustentável fica comprometido.",
    },
  };
  const nivel = score >= 8 ? "excelencia" : score >= 6 ? "competencia" : score >= 4 ? "atencao" : "critico";
  return textos[dim]?.[nivel] ?? "";
}

// ── AÇÕES POR SUBDIMENSÃO ────────────────────────────────────
const ACOES: Record<string, Record<string, string[]>> = {
  "Consistência de execução": {
    critico:    ["Implemente um ritual diário de 15 min para revisar suas 3 prioridades. Use papel ou app visível.", "Escolha UMA entrega importante para concluir completamente esta semana — sem iniciar outra antes de terminar."],
    atencao:    ["Crie um checklist semanal de entregas. Revise às sextas o que foi concluído vs. planejado.", "Use o método 'não quebre a corrente': marque cada dia que cumpriu seus compromissos essenciais."],
    competencia:["Estabeleça OKRs pessoais trimestrais com check-in mensal com alguém de confiança.", "Meça sua taxa de conclusão de tarefas planejadas. O objetivo é chegar a 80%+ por semana."],
    excelencia: ["Transforme seus sistemas pessoais em metodologia replicável. Documente e ensine ao time.", "Crie um programa de accountability para líderes baseado nos seus próprios padrões de execução."],
  },
  "Gestão do tempo e prioridades": {
    critico:    ["Bloqueie 2h todas as manhãs para trabalho profundo, sem reuniões. Comece amanhã.", "Faça uma auditoria da sua agenda: liste as 3 reuniões que você poderia eliminar ou delegar agora."],
    atencao:    ["Aplique a Matriz de Eisenhower: classifique tarefas em Urgente/Importante e elimine o que não agrega.", "Estabeleça horários fixos para e-mail e WhatsApp — não deixe que interrompam seu foco."],
    competencia:["Audite sua agenda das últimas 2 semanas: quanto tempo foi estratégico vs. operacional?", "Implemente 'semanas temáticas': agrupe reuniões em 2 dias e reserve os outros 3 para produção."],
    excelencia: ["Delegue sistematicamente o que é operacional e defenda seu tempo para atividades de alto impacto.", "Ensine sua metodologia de priorização para os líderes diretos — multiplique seu impacto."],
  },
  "Controle de hábitos e rotinas": {
    critico:    ["Defina UMA rotina matinal de 30 min para praticar consistentemente por 21 dias.", "Identifique o hábito que mais sabota sua produtividade e elimine ou substitua-o esta semana."],
    atencao:    ["Identifique seus 3 hábitos de maior impacto e crie gatilhos ambientais para mantê-los.", "Use o princípio do 'hábito atômico': reduza a barreira de entrada de cada hábito ao mínimo possível."],
    competencia:["Rastreie seus hábitos semanalmente. O que se mede, melhora.", "Crie rituais de encerramento do dia de trabalho para separar mentalmente o profissional do pessoal."],
    excelencia: ["Compartilhe sua arquitetura de hábitos com líderes como modelo de alta performance.", "Implante uma cultura de rituais na empresa: abertura de semana, retrospectivas, celebrações de conquistas."],
  },
  "Resiliência e constância": {
    critico:    ["Identifique seus principais gatilhos de desistência. Crie um protocolo pessoal para momentos de crise.", "Busque um mentor ou grupo de pares para suporte nos momentos de maior pressão."],
    atencao:    ["Estabeleça uma prática semanal de recuperação: exercício, descanso intencional ou meditação.", "Documente suas vitórias recentes. Releia quando a motivação cair."],
    competencia:["Construa uma rede de accountability — mentor, grupo de pares ou coach — para sustentação nas metas.", "Pratique 'post-mortems' pessoais: o que aprendeu com cada recuo? Transforme falhas em dados."],
    excelencia: ["Documente seu modelo mental de resiliência e use-o para formar líderes mais resilientes.", "Crie um programa formal de desenvolvimento de resiliência para a liderança da empresa."],
  },
  "Clareza de visão e propósito": {
    critico:    ["Reserve 2h esta semana para escrever: onde quero minha empresa em 3 anos? Em 1 parágrafo.", "Pergunte a 3 colaboradores-chave: 'qual é a nossa visão?' Se as respostas forem diferentes, é urgente."],
    atencao:    ["Compartilhe sua visão com 3 pessoas do negócio e pergunte: está clara? Inspira? O que falta?", "Transforme a visão em uma frase que qualquer funcionário consiga repetir de memória."],
    competencia:["Transforme a visão em narrativa — uma história que o time consiga contar aos clientes.", "Conecte cada projeto ou decisão relevante à visão de longo prazo durante as reuniões."],
    excelencia: ["Crie rituais que reforcem o propósito: comemore conquistas alinhadas à visão, conte histórias de impacto.", "Implante a visão nos processos de onboarding, avaliação e reconhecimento."],
  },
  "Definição de metas e estratégia": {
    critico:    ["Defina 1 objetivo estratégico para os próximos 90 dias com 2-3 indicadores de resultado.", "Escreva o que você NÃO vai fazer no próximo trimestre. Estratégia é escolha."],
    atencao:    ["Implemente OKRs trimestrais com revisão mensal: 1 Objetivo + 3 Key Results mensuráveis.", "Faça uma sessão de planejamento com o time toda virada de trimestre."],
    competencia:["Revise a estratégia semestralmente: o que mudou no mercado? As metas ainda fazem sentido?", "Crie um dashboard estratégico simples com 5-7 indicadores que o time acompanha semanalmente."],
    excelencia: ["Integre planejamento estratégico com BSC: perspectivas financeira, cliente, processos e aprendizado.", "Envolva líderes no processo de planejamento — co-criação gera comprometimento real."],
  },
  "Tomada de decisão": {
    critico:    ["Crie um critério simples: essa decisão alinha com a visão e gera resultado em 90 dias? Se sim, avance.", "Identifique as 3 decisões importantes que você está adiando. Tome todas até sexta-feira."],
    atencao:    ["Para decisões complexas, use: Problema → Opções → Critérios → Decisão → Data de revisão.", "Separe decisões reversíveis (decida rápido) de irreversíveis (investigue mais). Não trate tudo igual."],
    competencia:["Documente quais decisões você deve tomar sozinho e quais envolvem o time. Comunique ao grupo.", "Crie um registro de decisões importantes: o que foi decidido, por quê, e qual foi o resultado."],
    excelencia: ["Desenvolva a capacidade decisória do time: crie fóruns regulares e transfira autoridade gradualmente.", "Ensine frameworks de decisão para líderes. Autonomia com critério é o que escala a organização."],
  },
  "Alinhamento de time e cultura": {
    critico:    ["Agende uma reunião de alinhamento com o time esta semana: compartilhe visão e os 3 objetivos prioritários.", "Pergunte a cada colaborador-chave: o que está te impedindo de entregar mais? Ouça sem interromper."],
    atencao:    ["Implemente uma reunião semanal de 30 min com o time para sincronizar prioridades e remover bloqueios.", "Mapeie os valores culturais da empresa e identifique comportamentos que os contradizem."],
    competencia:["Defina 3 comportamentos observáveis para cada valor cultural. Reconheça quem os pratica publicamente.", "Faça pesquisas de clima semestrais e compartilhe os resultados com transparência."],
    excelencia: ["Construa um onboarding cultural robusto para que novos colaboradores absorvam a cultura desde o dia 1.", "Crie um programa de embaixadores culturais: líderes que modelam e perpetuam os valores."],
  },
  "Conhecimento técnico do negócio": {
    critico:    ["Mapeie os 5 processos mais críticos do negócio. Quais você não domina? Comece o estudo por eles.", "Passe 1 dia por mês na operação — observe, pergunte e aprenda com quem executa."],
    atencao:    ["Reserve 2h/mês para estudar tendências do seu setor: concorrentes, dados de mercado, cases.", "Identifique as competências técnicas onde o negócio depende só de você e inicie a transferência."],
    competencia:["Posicione-se como referência técnica no setor: escreva, fale em eventos, participe de comunidades.", "Promova sessões de aprendizado interno com o time — compartilhe o que você sabe."],
    excelencia: ["Crie um programa de formação técnica interna. Seu conhecimento multiplicado no time é vantagem competitiva.", "Construa parcerias com referências externas: consultores, acadêmicos, associações do setor."],
  },
  "Liderança e influência": {
    critico:    ["Agende 1-on-1 mensais com cada líder direto: como você está? Que apoio precisa? Que obstáculos enfrenta?", "Pratique escuta ativa: em sua próxima reunião, fale menos de 30% do tempo. Observe o que muda."],
    atencao:    ["Solicite feedback 360° anônimo do seu time e crie um plano de desenvolvimento com base nos resultados.", "Identifique 2-3 talentos com potencial e inicie mentoria estruturada com eles."],
    competencia:["Desenvolva líderes internos com autonomia crescente — delegue projetos completos, não tarefas isoladas.", "Pratique o modelo 'Situational Leadership': adapte seu estilo ao nível de maturidade de cada liderado."],
    excelencia: ["Sua empresa consegue operar 30 dias sem você? Se não, construir essa capacidade é o próximo nível.", "Crie uma pipeline de liderança: sucessão, desenvolvimento e retenção de talentos-chave."],
  },
  "Gestão financeira": {
    critico:    ["Implemente um dashboard financeiro simples: faturamento, custos fixos, margem e caixa. Revise semanalmente.", "Saiba de memória: seu faturamento mensal, sua margem líquida e seu ponto de equilíbrio."],
    atencao:    ["Entenda sua margem de contribuição por linha de produto/serviço. Qual gera mais valor real?", "Implante um orçamento anual e compare realizado vs. planejado mensalmente."],
    competencia:["Crie projeções financeiras trimestrais e revise mensalmente com o time responsável.", "Implemente uma política de aprovação de gastos para reduzir dependência da sua presença."],
    excelencia: ["Implante governança financeira: relatórios para sócios, políticas de aprovação e planejamento de longo prazo.", "Avalie indicadores avançados: LTV, CAC, churn, payback — métricas que antecipam o futuro."],
  },
  "Processos e sistemas": {
    critico:    ["Mapeie os 3 processos que mais consomem seu tempo. Automatize ou delegue pelo menos 1 este mês.", "Documente em 1 página como é realizado o processo mais crítico do negócio — qualquer pessoa deve conseguir executar."],
    atencao:    ["Crie SOPs (Procedimentos Operacionais Padrão) para os processos recorrentes mais importantes.", "Identifique os gargalos operacionais que param o crescimento. Priorize resolver o maior."],
    competencia:["Implemente KPIs operacionais para os principais processos. O que não se mede, não se gerencia.", "Revise os processos trimestralmente — o que funcionava em 10 pessoas pode não funcionar em 30."],
    excelencia: ["Construa uma cultura de melhoria contínua: retrospectivas, benchmarking e inovação incremental.", "Implante tecnologia para automatizar processos repetitivos — libere o time para atividades de maior valor."],
  },
};

function getAcoes(subdim: string, score: number): string[] {
  const nivel = score >= 8 ? "excelencia" : score >= 6 ? "competencia" : score >= 4 ? "atencao" : "critico";
  return ACOES[subdim]?.[nivel] ?? ["Desenvolva esta competência com apoio de mentoria especializada.", "Defina metas específicas e mensuráveis para evoluir nesta área nos próximos 90 dias."];
}

// ── PROPS ────────────────────────────────────────────────────
// ── MATRIZ DE MATURIDADE ─────────────────────────────────────
type FaixaFaturamento = "ate_7m" | "7m_30m" | "30m_100m" | "acima_100m";

const NIVEIS_MATURIDADE = [
  { nivel: "N1", titulo: "Executor",     desc: "Faz tudo sozinho. Sem delegação. A empresa depende 100% dele." },
  { nivel: "N2", titulo: "Gestor",       desc: "Delega tarefas. Ainda decide tudo. Time não opera sem aprovação." },
  { nivel: "N3", titulo: "Líder",        desc: "Delega responsabilidades. Time tem autonomia parcial." },
  { nivel: "N4", titulo: "Estrategista", desc: "Trabalha no negócio, não no operacional. Time executa com autonomia." },
  { nivel: "N5", titulo: "Visionário",   desc: "Empresa opera sem ele no dia a dia. Foco em legado e próximo ciclo." },
];

const FAT_PARA_NIVEL: Record<FaixaFaturamento, number> = {
  ate_7m: 2, "7m_30m": 3, "30m_100m": 4, acima_100m: 5,
};

const FAT_LABELS: Record<FaixaFaturamento, string> = {
  ate_7m:       "Até R$7M/ano",
  "7m_30m":     "R$7M a R$30M/ano",
  "30m_100m":   "R$30M a R$100M/ano",
  acima_100m:   "Acima de R$100M/ano",
};

const FAT_INTERVENCAO: Record<FaixaFaturamento, string> = {
  ate_7m:       "Primeiras contratações estratégicas e início da delegação de tarefas.",
  "7m_30m":     "Desenvolvimento de liderança sênior e transferência de responsabilidades ao time.",
  "30m_100m":   "Código de cultura + modelo de gestão estruturado com autonomia real do time.",
  acima_100m:   "Governança corporativa, conselho estruturado e planejamento de sucessão.",
};

function nivelAtualDoScore(score: number): number {
  if (score >= 8.5) return 5;
  if (score >= 7)   return 4;
  if (score >= 5.5) return 3;
  if (score >= 3.5) return 2;
  return 1;
}

type Props = {
  nome: string;
  empresa?: string | null;
  cargo?: string | null;
  faturamento?: string | null;
  resultado: Resultado;
  data: string;
};

export function DiagnosticoPDF({ nome, empresa, cargo, faturamento, resultado, data }: Props) {
  const faixaGeral = faixaScore(resultado.geral);

  // Todas subdimensões ordenadas por score (menores primeiro) para o plano de ação
  const todasSubs = (["disciplina", "direcao", "dominio"] as const).flatMap((dim) =>
    SUBDIM_POR_DIM[dim].map((sub) => ({
      sub, dim, score: resultado.subdimensoes[sub] ?? 0,
    }))
  ).sort((a, b) => a.score - b.score);

  // Prioridades: Críticas e Atenção primeiro (até 6 itens)
  const prioridades = todasSubs.filter((s) => s.score < 6).slice(0, 6);
  const complementares = todasSubs.filter((s) => s.score >= 6).slice(0, 3);

  return (
    <Document>
      {/* ── PÁG 1: CAPA ──────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.capa}>
          <View>
            <Text style={styles.capaTitle}>Mendonça & Co</Text>
            <Text style={styles.capaSubtitle}>Consultoria de Board e Cultura Organizacional</Text>
          </View>
          <View>
            <Text style={[styles.capaSubtitle, { fontSize: 11, marginBottom: 8 }]}>DIAGNÓSTICO 3D DE LIDERANÇA</Text>
            <View style={styles.capaLinha} />
            <Text style={styles.capaNome}>{nome}</Text>
            {(cargo || empresa) && (
              <Text style={{ color: CORES.goldLight, fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                {[cargo, empresa].filter(Boolean).join(" · ")}
              </Text>
            )}
            <Text style={styles.capaData}>{data}</Text>
          </View>
          <Text style={styles.capaRodape}>Documento confidencial · mendonca.co</Text>
        </View>
      </Page>

      {/* ── PÁG 2: VISÃO GERAL + RADAR ───────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Visão Geral</Text>
          <Text style={styles.secaoSub}>Resultado consolidado das três dimensões avaliadas</Text>

          {/* Layout duas colunas: score + radar */}
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
            {/* Coluna esquerda: score geral + cards dim */}
            <View style={{ flex: 1 }}>
              <View style={styles.scoreBox}>
                <Text style={[styles.scoreFaixa, { color: CORES.muted, marginBottom: 4 }]}>Score Geral</Text>
                <Text style={styles.scoreNum}>{resultado.geral.toFixed(1)}</Text>
                <Text style={[styles.scoreFaixa, { color: faixaGeral.cor, fontFamily: "Helvetica-Bold" }]}>
                  {faixaGeral.label}
                </Text>
                <Text style={{ fontSize: 9, color: CORES.muted, marginTop: 2 }}>{faixaGeral.descricao}</Text>
              </View>

              {(["disciplina", "direcao", "dominio"] as const).map((dim) => {
                const score = resultado.scores[dim];
                const faixa = faixaScore(score);
                return (
                  <View key={dim} style={[styles.dimCard, { marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dimLabel}>{DIMENSAO_LABELS[dim]}</Text>
                      <View style={[styles.barraBg, { marginTop: 4 }]}>
                        <View style={[styles.barraFill, { width: `${(score / 10) * 100}%`, backgroundColor: faixa.cor }]} />
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: CORES.primary }}>{score.toFixed(1)}</Text>
                      <Text style={{ fontSize: 8, color: faixa.cor }}>{faixa.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Coluna direita: Radar chart */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 8, textAlign: "center" }}>
                Perfil 3D
              </Text>
              <RadarChart scores={[resultado.scores.disciplina, resultado.scores.direcao, resultado.scores.dominio]} />
            </View>
          </View>

          {/* Legenda */}
          <View style={{ backgroundColor: CORES.bg, borderRadius: 8, padding: 14, flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Excelência (8-10)", cor: CORES.success },
              { label: "Competência (6-7)", cor: CORES.gold },
              { label: "Atenção (4-5)", cor: CORES.warning },
              { label: "Crítico (1-3)", cor: CORES.danger },
            ].map((f) => (
              <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: f.cor }} />
                <Text style={{ fontSize: 9, color: CORES.text }}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁG 3: MATRIZ DE MATURIDADE ──────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Matriz de Maturidade de Liderança</Text>
          <Text style={styles.secaoSub}>Em qual nível você está — e onde precisa chegar</Text>

          {(() => {
            const nivelAtual = nivelAtualDoScore(resultado.geral);
            const fat = faturamento as FaixaFaturamento | null;
            const nivelNecessario = fat ? FAT_PARA_NIVEL[fat] : null;
            const gap = nivelNecessario !== null ? nivelNecessario - nivelAtual : null;

            return (
              <View>
                {/* Cards dos 5 níveis */}
                {NIVEIS_MATURIDADE.map((n, i) => {
                  const idx = i + 1;
                  const isAtual = idx === nivelAtual;
                  const isNecessario = nivelNecessario !== null && idx === nivelNecessario;
                  const isAmbos = isAtual && isNecessario;
                  const bgColor = isAmbos ? CORES.success : isAtual ? CORES.primary : isNecessario ? CORES.gold + "20" : CORES.bg;
                  const borderColor = isAmbos ? CORES.success : isAtual ? CORES.primary : isNecessario ? CORES.gold : "transparent";
                  const textCor = isAtual ? CORES.white : CORES.text;
                  const mutedCor = isAtual ? CORES.goldLight : CORES.muted;

                  return (
                    <View key={idx} style={{
                      flexDirection: "row", alignItems: "stretch", marginBottom: 8,
                      backgroundColor: bgColor,
                      borderRadius: 8, borderWidth: 1.5, borderColor,
                      overflow: "hidden",
                    }}>
                      {/* Badge lateral */}
                      <View style={{
                        width: 48, alignItems: "center", justifyContent: "center", padding: 10,
                        backgroundColor: isAtual ? CORES.gold : isNecessario ? CORES.gold : CORES.goldLight + "40",
                      }}>
                        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary }}>{n.nivel}</Text>
                        <Text style={{ fontSize: 7, color: CORES.primary, marginTop: 2, textAlign: "center" }}>{idx}</Text>
                      </View>

                      {/* Conteúdo */}
                      <View style={{ flex: 1, padding: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: textCor }}>{n.titulo}</Text>
                          {isAtual && !isAmbos && (
                            <View style={{ backgroundColor: CORES.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: CORES.primary }}>VOCÊ ESTÁ AQUI</Text>
                            </View>
                          )}
                          {isNecessario && !isAmbos && (
                            <View style={{ backgroundColor: CORES.gold + "30", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: CORES.gold }}>
                              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: CORES.gold }}>NÍVEL NECESSÁRIO</Text>
                            </View>
                          )}
                          {isAmbos && (
                            <View style={{ backgroundColor: CORES.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: CORES.white }}>VOCÊ ESTÁ NO NÍVEL CERTO</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 9, color: mutedCor, lineHeight: 1.5 }}>{n.desc}</Text>
                      </View>
                    </View>
                  );
                })}

                {/* Análise de gap */}
                <View style={{ marginTop: 16, backgroundColor: CORES.bg, borderRadius: 8, padding: 16 }}>
                  {gap === null ? (
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 6 }}>
                        Seu nível atual: {NIVEIS_MATURIDADE[nivelAtual - 1].nivel} — {NIVEIS_MATURIDADE[nivelAtual - 1].titulo}
                      </Text>
                      <Text style={{ fontSize: 10, color: CORES.muted, lineHeight: 1.6 }}>
                        Informe o faturamento da empresa para cruzarmos com o nível necessário para o seu estágio de crescimento.
                      </Text>
                    </View>
                  ) : gap <= 0 ? (
                    <View>
                      <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.success, marginBottom: 6 }}>
                        Você está no nível certo para o seu faturamento.
                      </Text>
                      <Text style={{ fontSize: 10, color: CORES.text, lineHeight: 1.6 }}>
                        Para faturamento de {FAT_LABELS[fat!]}, o nível necessário é {NIVEIS_MATURIDADE[nivelNecessario! - 1].nivel} — {NIVEIS_MATURIDADE[nivelNecessario! - 1].titulo}.
                        Você já opera neste nível ou acima. O próximo desafio é sustentar e replicar esse padrão no time.
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 9, color: CORES.muted, marginBottom: 2 }}>Nível atual</Text>
                          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: CORES.primary }}>
                            {NIVEIS_MATURIDADE[nivelAtual - 1].nivel} — {NIVEIS_MATURIDADE[nivelAtual - 1].titulo}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16, color: CORES.gold }}>→</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 9, color: CORES.muted, marginBottom: 2 }}>Nível necessário ({FAT_LABELS[fat!]})</Text>
                          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: CORES.danger }}>
                            {NIVEIS_MATURIDADE[nivelNecessario! - 1].nivel} — {NIVEIS_MATURIDADE[nivelNecessario! - 1].titulo}
                          </Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: CORES.danger + "12", borderRadius: 6, padding: 10, borderLeftWidth: 3, borderLeftColor: CORES.danger }}>
                        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: CORES.danger, marginBottom: 4 }}>
                          Gap de {gap} nível{gap > 1 ? "is" : ""} — intervenção prioritária
                        </Text>
                        <Text style={{ fontSize: 9, color: CORES.text, lineHeight: 1.6 }}>{FAT_INTERVENCAO[fat!]}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })()}
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁGS 4-5-6: UMA POR DIMENSÃO ─────────────────────── */}
      {(["disciplina", "direcao", "dominio"] as const).map((dim, idx) => {
        const score = resultado.scores[dim];
        const faixa = faixaScore(score);
        const subdims = SUBDIM_POR_DIM[dim];
        return (
          <Page key={dim} size="A4" style={styles.page}>
            <View style={styles.pagina}>
              <View style={{ backgroundColor: CORES.primary, borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <Text style={{ color: CORES.goldLight, fontSize: 10, marginBottom: 4 }}>DIMENSÃO {idx + 1} DE 3</Text>
                <Text style={{ color: CORES.gold, fontSize: 24, fontFamily: "Helvetica-Bold" }}>{DIMENSAO_LABELS[dim]}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
                  <Text style={{ color: CORES.white, fontSize: 32, fontFamily: "Helvetica-Bold" }}>{score.toFixed(1)}</Text>
                  <Text style={{ color: faixa.cor, fontSize: 12 }}>{faixa.label} — {faixa.descricao}</Text>
                </View>
              </View>

              <Text style={[styles.analiseTitle, { marginBottom: 10 }]}>Resultado por subdimensão</Text>
              {subdims.map((sub) => {
                const subScore = resultado.subdimensoes[sub] ?? 0;
                const subFaixa = faixaScore(subScore);
                return (
                  <View key={sub} style={styles.barraContainer}>
                    <View style={styles.barraLabel}>
                      <Text style={styles.barraLabelText}>{sub}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 8, color: subFaixa.cor }}>{subFaixa.label}</Text>
                        <Text style={styles.barraLabelScore}>{subScore.toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.barraBg}>
                      <View style={[styles.barraFill, { width: `${(subScore / 10) * 100}%`, backgroundColor: subFaixa.cor }]} />
                    </View>
                  </View>
                );
              })}

              <View style={[styles.analiseBox, { marginTop: 16 }]}>
                <Text style={styles.analiseTitle}>Análise</Text>
                <Text style={styles.analiseText}>{analiseTexto(dim, score)}</Text>
              </View>
            </View>
            <View style={styles.rodape}>
              <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D</Text>
              <Text style={styles.rodapeText}>{nome} · {data}</Text>
            </View>
          </Page>
        );
      })}

      {/* ── PÁG 6: PLANO DE AÇÃO ─────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Plano de Ação</Text>
          <Text style={styles.secaoSub}>Ações priorizadas com base no seu perfil — menores scores primeiro</Text>

          {/* Prioridades críticas/atenção */}
          {prioridades.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <View style={{ width: 4, height: 14, backgroundColor: CORES.danger, borderRadius: 2 }} />
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary }}>
                  Foco imediato — subdimensões abaixo de 6.0
                </Text>
              </View>
              {prioridades.map((item, i) => {
                const faixa = faixaScore(item.score);
                const acoes = getAcoes(item.sub, item.score);
                return (
                  <View key={i} style={{ marginBottom: 12, backgroundColor: CORES.bg, borderRadius: 6, padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: faixa.cor, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: CORES.white }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary }}>{item.sub}</Text>
                        <Text style={{ fontSize: 8, color: faixa.cor }}>{DIMENSAO_LABELS[item.dim]} · {item.score.toFixed(1)} — {faixa.label}</Text>
                      </View>
                    </View>
                    {acoes.map((acao, j) => (
                      <View key={j} style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                        <Text style={{ fontSize: 9, color: faixa.cor, marginTop: 1 }}>▸</Text>
                        <Text style={{ flex: 1, fontSize: 9, color: CORES.text, lineHeight: 1.5 }}>{acao}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* Consolidação — scores 6+ */}
          {complementares.length > 0 && (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View style={{ width: 4, height: 14, backgroundColor: CORES.gold, borderRadius: 2 }} />
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary }}>
                  Consolidar — manter e expandir o que já funciona
                </Text>
              </View>
              {complementares.map((item, i) => {
                const faixa = faixaScore(item.score);
                const acoes = getAcoes(item.sub, item.score);
                return (
                  <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 8, padding: 10, backgroundColor: CORES.bg, borderRadius: 6 }}>
                    <View>
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: faixa.cor }}>{item.score.toFixed(1)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 3 }}>
                        {item.sub} · <Text style={{ color: CORES.muted, fontFamily: "Helvetica" }}>{DIMENSAO_LABELS[item.dim]}</Text>
                      </Text>
                      <Text style={{ fontSize: 9, color: CORES.text, lineHeight: 1.5 }}>▸ {acoes[0]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁG 7: CTA ───────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Próximos Passos</Text>
          <Text style={styles.secaoSub}>Recomendações baseadas no seu perfil 3D</Text>

          {(["disciplina", "direcao", "dominio"] as const)
            .map((dim) => ({ dim, score: resultado.scores[dim], faixa: faixaScore(resultado.scores[dim]) }))
            .sort((a, b) => a.score - b.score)
            .map((item, i) => (
              <View key={item.dim} style={[styles.passoItem, { marginBottom: 16 }]}>
                <View style={[styles.passoBullet, { backgroundColor: item.faixa.cor }]}>
                  <Text style={styles.passoBulletText}>{i + 1}</Text>
                </View>
                <View style={styles.passoText}>
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 3 }}>
                    {DIMENSAO_LABELS[item.dim]} · {item.score.toFixed(1)} — {item.faixa.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: CORES.text, lineHeight: 1.6 }}>
                    {analiseTexto(item.dim, item.score).split(".")[0]}.
                  </Text>
                </View>
              </View>
            ))}

          <View style={{ backgroundColor: CORES.primary, borderRadius: 8, padding: 24, marginTop: 20 }}>
            <Text style={{ color: CORES.gold, fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
              Quer aprofundar este diagnóstico?
            </Text>
            <Text style={{ color: CORES.goldLight, fontSize: 10, lineHeight: 1.7 }}>
              Na Mentoria Expressa, trabalhamos diretamente as dimensões com menor score em uma sessão focada e de alto impacto.
              O Plano de Ação deste relatório é o ponto de partida — na mentoria, construímos juntos o caminho.
            </Text>
            <Text style={{ color: CORES.gold, fontSize: 11, marginTop: 12, fontFamily: "Helvetica-Bold" }}>
              guilherme@mendonca.co
            </Text>
          </View>
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D · {data}</Text>
          <Text style={styles.rodapeText}>{nome}</Text>
        </View>
      </Page>
    </Document>
  );
}
