import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Resultado } from "@/lib/diagnostico/perguntas";
import { faixaScore } from "@/lib/diagnostico/perguntas";

const CORES = {
  primary: "#0D2B2E",
  gold: "#C9A84C",
  goldLight: "#E8D5A3",
  bg: "#F5F0E8",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  success: "#2D6A4F",
  warning: "#E9C46A",
  danger: "#C1121F",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { backgroundColor: CORES.white, fontFamily: "Helvetica", padding: 0 },
  // Capa
  capa: { backgroundColor: CORES.primary, flex: 1, padding: 60, justifyContent: "space-between" },
  capaTitle: { color: CORES.gold, fontSize: 36, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  capaSubtitle: { color: CORES.goldLight, fontSize: 14, opacity: 0.8 },
  capaLinha: { width: 60, height: 2, backgroundColor: CORES.gold, marginVertical: 24 },
  capaNome: { color: CORES.white, fontSize: 22, fontFamily: "Helvetica-Bold" },
  capaData: { color: CORES.goldLight, fontSize: 11, marginTop: 6, opacity: 0.7 },
  capaRodape: { color: CORES.goldLight, fontSize: 10, opacity: 0.5 },
  // Página interna
  pagina: { padding: 50, flex: 1 },
  secaoTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 6 },
  secaoSub: { fontSize: 11, color: CORES.muted, marginBottom: 24 },
  // Score geral
  scoreBox: { backgroundColor: CORES.bg, borderRadius: 8, padding: 24, alignItems: "center", marginBottom: 24 },
  scoreNum: { fontSize: 52, fontFamily: "Helvetica-Bold", color: CORES.primary },
  scoreFaixa: { fontSize: 13, marginTop: 4 },
  // Cards de dimensão
  dimRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  dimCard: { flex: 1, backgroundColor: CORES.bg, borderRadius: 8, padding: 16 },
  dimLabel: { fontSize: 9, color: CORES.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  dimScore: { fontSize: 28, fontFamily: "Helvetica-Bold", color: CORES.primary },
  dimFaixa: { fontSize: 9, marginTop: 2 },
  // Barra de progresso
  barraContainer: { marginBottom: 12 },
  barraLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barraLabelText: { fontSize: 10, color: CORES.text },
  barraLabelScore: { fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary },
  barraBg: { height: 8, backgroundColor: "#E8D5A3", borderRadius: 4 },
  barraFill: { height: 8, borderRadius: 4 },
  // Análise
  analiseBox: { backgroundColor: CORES.bg, borderRadius: 8, padding: 16, marginBottom: 16 },
  analiseTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 6 },
  analiseText: { fontSize: 10, color: CORES.text, lineHeight: 1.6 },
  // Rodapé
  rodape: { position: "absolute", bottom: 24, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between" },
  rodapeText: { fontSize: 9, color: CORES.muted },
  // Próximos passos
  passoItem: { flexDirection: "row", gap: 10, marginBottom: 12 },
  passoBullet: { width: 20, height: 20, borderRadius: 10, backgroundColor: CORES.gold, alignItems: "center", justifyContent: "center" },
  passoBulletText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: CORES.primary },
  passoText: { flex: 1, fontSize: 10, color: CORES.text, lineHeight: 1.6, paddingTop: 2 },
});

const DIMENSAO_LABELS: Record<string, string> = {
  disciplina: "Disciplina",
  direcao: "Direção",
  dominio: "Domínio",
};

const SUBDIM_POR_DIM: Record<string, string[]> = {
  disciplina: ["Consistência de execução", "Gestão do tempo e prioridades", "Controle de hábitos e rotinas", "Resiliência e constância"],
  direcao: ["Clareza de visão e propósito", "Definição de metas e estratégia", "Tomada de decisão", "Alinhamento de time e cultura"],
  dominio: ["Conhecimento técnico do negócio", "Liderança e influência", "Gestão financeira", "Processos e sistemas"],
};

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

type Props = {
  nome: string;
  resultado: Resultado;
  data: string;
};

export function DiagnosticoPDF({ nome, resultado, data }: Props) {
  const faixaGeral = faixaScore(resultado.geral);

  return (
    <Document>
      {/* ── PÁGINA 1: CAPA ─────────────────────────────────── */}
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
            <Text style={styles.capaData}>{data}</Text>
          </View>

          <Text style={styles.capaRodape}>Documento confidencial · mendonca.co</Text>
        </View>
      </Page>

      {/* ── PÁGINA 2: VISÃO GERAL ──────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Visão Geral</Text>
          <Text style={styles.secaoSub}>Resultado consolidado das três dimensões avaliadas</Text>

          {/* Score geral */}
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreFaixa, { color: CORES.muted, marginBottom: 4 }]}>Score Geral</Text>
            <Text style={styles.scoreNum}>{resultado.geral.toFixed(1)}</Text>
            <Text style={[styles.scoreFaixa, { color: faixaGeral.cor, fontFamily: "Helvetica-Bold" }]}>
              {faixaGeral.label} — {faixaGeral.descricao}
            </Text>
          </View>

          {/* Cards das dimensões */}
          <View style={styles.dimRow}>
            {(["disciplina", "direcao", "dominio"] as const).map((dim) => {
              const score = resultado.scores[dim];
              const faixa = faixaScore(score);
              return (
                <View key={dim} style={styles.dimCard}>
                  <Text style={styles.dimLabel}>{DIMENSAO_LABELS[dim]}</Text>
                  <Text style={styles.dimScore}>{score.toFixed(1)}</Text>
                  <Text style={[styles.dimFaixa, { color: faixa.cor }]}>{faixa.label}</Text>
                  <View style={[styles.barraBg, { marginTop: 8 }]}>
                    <View style={[styles.barraFill, { width: `${(score / 10) * 100}%`, backgroundColor: faixa.cor }]} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legenda de faixas */}
          <View style={{ backgroundColor: CORES.bg, borderRadius: 8, padding: 16 }}>
            <Text style={[styles.analiseTitle, { marginBottom: 10 }]}>Legenda de faixas</Text>
            {[
              { label: "Zona de Excelência (8–10)", cor: CORES.success, desc: "Manter e expandir" },
              { label: "Zona de Competência (6–7)", cor: CORES.gold, desc: "Consolidar" },
              { label: "Zona de Atenção (4–5)", cor: CORES.warning, desc: "Desenvolver ativamente" },
              { label: "Zona Crítica (1–3)", cor: CORES.danger, desc: "Prioridade imediata" },
            ].map((f) => (
              <View key={f.label} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: f.cor, marginRight: 8 }} />
                <Text style={{ fontSize: 10, color: CORES.text }}>{f.label} — {f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁGINAS 3, 4, 5: UMA POR DIMENSÃO ────────────── */}
      {(["disciplina", "direcao", "dominio"] as const).map((dim, idx) => {
        const score = resultado.scores[dim];
        const faixa = faixaScore(score);
        const subdims = SUBDIM_POR_DIM[dim];

        return (
          <Page key={dim} size="A4" style={styles.page}>
            <View style={styles.pagina}>
              {/* Header da dimensão */}
              <View style={{ backgroundColor: CORES.primary, borderRadius: 8, padding: 20, marginBottom: 24 }}>
                <Text style={{ color: CORES.goldLight, fontSize: 10, marginBottom: 4 }}>
                  DIMENSÃO {idx + 1} DE 3
                </Text>
                <Text style={{ color: CORES.gold, fontSize: 24, fontFamily: "Helvetica-Bold" }}>
                  {DIMENSAO_LABELS[dim]}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
                  <Text style={{ color: CORES.white, fontSize: 32, fontFamily: "Helvetica-Bold" }}>
                    {score.toFixed(1)}
                  </Text>
                  <Text style={{ color: faixa.cor, fontSize: 12 }}>{faixa.label}</Text>
                </View>
              </View>

              {/* Subdimensões */}
              <Text style={[styles.analiseTitle, { marginBottom: 12 }]}>Resultado por subdimensão</Text>
              {subdims.map((sub) => {
                const subScore = resultado.subdimensoes[sub] ?? 0;
                const subFaixa = faixaScore(subScore);
                return (
                  <View key={sub} style={styles.barraContainer}>
                    <View style={styles.barraLabel}>
                      <Text style={styles.barraLabelText}>{sub}</Text>
                      <Text style={styles.barraLabelScore}>{subScore.toFixed(1)}</Text>
                    </View>
                    <View style={styles.barraBg}>
                      <View style={[styles.barraFill, { width: `${(subScore / 10) * 100}%`, backgroundColor: subFaixa.cor }]} />
                    </View>
                  </View>
                );
              })}

              {/* Análise */}
              <View style={[styles.analiseBox, { marginTop: 20 }]}>
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

      {/* ── PÁGINA 6: PRÓXIMOS PASSOS ─────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Próximos Passos</Text>
          <Text style={styles.secaoSub}>Recomendações baseadas no seu perfil 3D</Text>

          {/* Prioridades por faixa */}
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
                    {item.faixa.descricao}. {analiseTexto(item.dim, item.score).split(".")[0]}.
                  </Text>
                </View>
              </View>
            ))}

          {/* CTA */}
          <View style={{ backgroundColor: CORES.primary, borderRadius: 8, padding: 24, marginTop: 24 }}>
            <Text style={{ color: CORES.gold, fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
              Quer aprofundar este diagnóstico?
            </Text>
            <Text style={{ color: CORES.goldLight, fontSize: 10, lineHeight: 1.7 }}>
              Na Mentoria Expressa, trabalhamos diretamente as dimensões com menor score em uma sessão focada e de alto impacto.
              Entre em contato para agendar o seu próximo passo.
            </Text>
            <Text style={{ color: CORES.gold, fontSize: 11, marginTop: 12, fontFamily: "Helvetica-Bold" }}>
              guilherme@mendonca.co
            </Text>
          </View>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Diagnóstico 3D</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>
    </Document>
  );
}
