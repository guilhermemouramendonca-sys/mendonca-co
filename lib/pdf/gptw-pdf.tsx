import { Document, Page, Text, View, StyleSheet, Svg, Circle } from "@react-pdf/renderer";
import type { ResultadoGPTW } from "@/lib/pesquisas/gptw";

const C = {
  primary: "#0D2B2E", gold: "#C9A84C", goldLight: "#E8D5A3",
  bg: "#F5F0E8", text: "#1A1A1A", muted: "#6B6B6B", white: "#FFFFFF",
  success: "#27AE60", warning: "#E67E22", danger: "#C0392B",
};

const S = StyleSheet.create({
  page: { backgroundColor: C.white, fontFamily: "Helvetica", padding: 0 },
  capa: { backgroundColor: C.primary, flex: 1, padding: 60, justifyContent: "space-between" },
  pag: { padding: 50, flex: 1 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 6 },
  sub: { fontSize: 11, color: C.muted, marginBottom: 20 },
  rodape: { position: "absolute", bottom: 24, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between" },
  rodapeT: { fontSize: 9, color: C.muted },
});

type Dim = "Credibilidade" | "Respeito" | "Imparcialidade" | "Orgulho" | "Camaradagem";
const DIMS: Dim[] = ["Credibilidade", "Respeito", "Imparcialidade", "Orgulho", "Camaradagem"];

const DIM_DESC: Record<Dim, string> = {
  Credibilidade:  "Comunicação, competência e integridade dos líderes.",
  Respeito:       "Apoio profissional, colaboração e cuidado com as pessoas.",
  Imparcialidade: "Equidade, justiça e ausência de favoritismo ou discriminação.",
  Orgulho:        "Senso de orgulho pelo trabalho individual, pelo time e pela empresa.",
  Camaradagem:    "Hospitalidade, comunidade, diversão e senso de pertencimento.",
};

const DIM_ACOES: Record<Dim, Record<string, string[]>> = {
  Credibilidade: {
    baixo: [
      "Realize reuniões mensais de comunicação com o time — transparência sobre metas, resultados e desafios gera confiança.",
      "Cumpra os compromissos assumidos publicamente. Se não puder cumprir, comunique antes, não depois.",
    ],
    medio: [
      "Solicite perguntas anônimas do time e responda publicamente na próxima reunião.",
      "Compartilhe decisões difíceis com o contexto real — o time suporta melhor o que entende.",
    ],
    alto: [
      "Mantenha a consistência em momentos de pressão — é quando a credibilidade mais se fortalece ou se perde.",
      "Torne os líderes do nível abaixo agentes de credibilidade — multiplique a confiança.",
    ],
  },
  Respeito: {
    baixo: [
      "Implante 1-on-1s mensais para cada pessoa — o respeito começa pela atenção individual.",
      "Revise as condições de trabalho: espaço, ferramentas, horários. O básico precisa funcionar.",
    ],
    medio: [
      "Reconheça publicamente o trabalho bem feito — o respeito também se manifesta na visibilidade.",
      "Identifique quem está sobrecarregado e redistribua tarefas antes que a pessoa peça ou saia.",
    ],
    alto: [
      "Crie políticas formais de bem-estar e flexibilidade — respeito institucionalizado.",
      "Avalie se o respeito é sentido igualmente por todos os grupos da empresa.",
    ],
  },
  Imparcialidade: {
    baixo: [
      "Audite os critérios de promoção, aumento e reconhecimento — são claros e consistentes?",
      "Crie canais anônimos para reportar favorecimentos percebidos e responda seriamente.",
    ],
    medio: [
      "Torne os critérios de avaliação e promoção explícitos e públicos para toda a empresa.",
      "Treine líderes para identificar e combater vieses inconscientes nas decisões.",
    ],
    alto: [
      "Meça diversidade em cargos de liderança e compare com a distribuição geral da empresa.",
      "Crie um comitê de equidade para revisar decisões de RH periodicamente.",
    ],
  },
  Orgulho: {
    baixo: [
      "Conte histórias de impacto regularmente — como o trabalho da empresa mudou a vida de clientes reais.",
      "Conecte o trabalho individual ao propósito maior — o 'porquê' precisa estar presente no dia a dia.",
    ],
    medio: [
      "Celebre conquistas do time publicamente e com frequência — vitórias pequenas também contam.",
      "Envolva o time nas decisões que afetam o trabalho deles — participação gera orgulho.",
    ],
    alto: [
      "Construa uma narrativa de empresa que o time queira contar fora do trabalho.",
      "Crie um programa de embaixadores: pessoas que representam a empresa com orgulho.",
    ],
  },
  Camaradagem: {
    baixo: [
      "Crie momentos de conexão não relacionados ao trabalho — almoços, eventos simples, atividades voluntárias.",
      "Observe os subgrupos e silos da equipe — camaradagem entre grupos diferentes precisa ser construída.",
    ],
    medio: [
      "Facilite onboarding social: novos colaboradores precisam de conexão além do técnico.",
      "Crie tradições de time — rituais que criam senso de pertencimento ao longo do tempo.",
    ],
    alto: [
      "Inclua diversidade nos grupos de camaradagem — não só amizades entre iguais.",
      "Documente e mantenha as tradições culturais mesmo com o crescimento da empresa.",
    ],
  },
};

function getNivelDim(pct: number) {
  if (pct >= 70) return "alto";
  if (pct >= 40) return "medio";
  return "baixo";
}

function corDim(pct: number): string {
  if (pct >= 70) return C.success;
  if (pct >= 50) return C.gold;
  if (pct >= 30) return C.warning;
  return C.danger;
}

// Gauge circular para Trust Index
function TrustGauge({ value }: { value: number }) {
  const r = 60, cx = 80, cy = 80;
  const circum = 2 * Math.PI * r;
  const filled = (value / 100) * circum;
  const cor = value >= 70 ? C.success : value >= 50 ? C.gold : value >= 30 ? C.warning : C.danger;

  return (
    <Svg width={160} height={160} viewBox="0 0 160 160">
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8D5A3" strokeWidth={14} />
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={cor}
        strokeWidth={14}
        strokeDasharray={`${filled} ${circum - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </Svg>
  );
}

type Props = { nome: string; empresa?: string | null; cargo?: string | null; resultado: ResultadoGPTW; data: string };

export function GPTWPDF({ nome, empresa, cargo, resultado, data }: Props) {
  const { trustIndex, porDimensao, nivel, cor } = resultado;

  const dimsOrdenadas = DIMS
    .map((d) => ({ dim: d, pct: porDimensao[d] ?? 0 }))
    .sort((a, b) => a.pct - b.pct);

  return (
    <Document>
      {/* CAPA */}
      <Page size="A4" style={S.page}>
        <View style={S.capa}>
          <View>
            <Text style={{ color: C.gold, fontSize: 36, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>Mendonça & Co</Text>
            <Text style={{ color: C.goldLight, fontSize: 14, opacity: 0.8 }}>Consultoria de Board e Cultura Organizacional</Text>
          </View>
          <View>
            <Text style={{ color: C.goldLight, fontSize: 11, marginBottom: 8 }}>DIAGNÓSTICO DE CULTURA — GPTW</Text>
            <View style={{ width: 60, height: 2, backgroundColor: C.gold, marginVertical: 20 }} />
            <Text style={{ color: C.white, fontSize: 22, fontFamily: "Helvetica-Bold" }}>{nome}</Text>
            {(cargo || empresa) && (
              <Text style={{ color: C.goldLight, fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                {[cargo, empresa].filter(Boolean).join(" · ")}
              </Text>
            )}
            <Text style={{ color: C.goldLight, fontSize: 11, marginTop: 6, opacity: 0.7 }}>{data}</Text>
          </View>
          <Text style={{ color: C.goldLight, fontSize: 10, opacity: 0.5 }}>Documento confidencial · mendonca.co</Text>
        </View>
      </Page>

      {/* PÁG 2: RESULTADO */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Trust Index</Text>
          <Text style={S.sub}>Índice de confiança organizacional — GPTW</Text>

          <View style={{ flexDirection: "row", gap: 20, alignItems: "center", marginBottom: 20 }}>
            {/* Gauge */}
            <View style={{ alignItems: "center" }}>
              <TrustGauge value={trustIndex} />
              <View style={{ position: "absolute", top: 52, alignItems: "center" }}>
                <Text style={{ fontSize: 32, fontFamily: "Helvetica-Bold", color: C.primary }}>{trustIndex}</Text>
                <Text style={{ fontSize: 9, color: C.muted }}>Trust Index</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: cor + "18", borderRadius: 8, padding: 14, borderLeftWidth: 3, borderLeftColor: cor }}>
                <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>CLASSIFICAÇÃO</Text>
                <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: cor, marginBottom: 8 }}>{nivel}</Text>
                <Text style={{ fontSize: 9, color: C.text, lineHeight: 1.6 }}>
                  {trustIndex >= 80
                    ? "Cultura de alto desempenho. A empresa é genuinamente reconhecida como um excelente lugar para trabalhar."
                    : trustIndex >= 65
                    ? "Boa cultura com oportunidades de fortalecimento. Foco nas dimensões com menor score."
                    : trustIndex >= 50
                    ? "Cultura em desenvolvimento. Há fundações, mas gaps significativos em pelo menos uma dimensão."
                    : "Cultura com necessidade urgente de intervenção. O ambiente afeta retenção e performance."}
                </Text>
              </View>
            </View>
          </View>

          {/* Barras por dimensão */}
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 12 }}>
            Resultado por dimensão
          </Text>
          {DIMS.map((dim) => {
            const pct = Math.round(porDimensao[dim] ?? 0);
            const c = corDim(pct);
            return (
              <View key={dim} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 10, color: C.text }}>{dim}</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: c }}>{pct}%</Text>
                </View>
                <View style={{ height: 8, backgroundColor: "#E8D5A3", borderRadius: 4 }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: c }} />
                </View>
                <Text style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>{DIM_DESC[dim]}</Text>
              </View>
            );
          })}
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · GPTW</Text><Text style={S.rodapeT}>{nome} · {data}</Text></View>
      </Page>

      {/* PÁG 3: PLANO DE AÇÃO */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Plano de Ação Cultural</Text>
          <Text style={S.sub}>Dimensões prioritárias — menores índices primeiro</Text>

          {dimsOrdenadas.map((item, i) => {
            const nivelDim = getNivelDim(item.pct);
            const acoes = DIM_ACOES[item.dim][nivelDim];
            const c = corDim(item.pct);
            return (
              <View key={item.dim} style={{ marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary }}>{item.dim}</Text>
                    <Text style={{ fontSize: 8, color: c }}>{item.pct}% — {DIM_DESC[item.dim]}</Text>
                  </View>
                </View>
                {acoes.map((acao, j) => (
                  <View key={j} style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 9, color: c, marginTop: 1 }}>▸</Text>
                    <Text style={{ flex: 1, fontSize: 9, color: C.text, lineHeight: 1.5 }}>{acao}</Text>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={{ backgroundColor: C.primary, borderRadius: 8, padding: 20, marginTop: 4 }}>
            <Text style={{ color: C.gold, fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              Quer construir uma cultura que sustente a estratégia?
            </Text>
            <Text style={{ color: C.goldLight, fontSize: 10, lineHeight: 1.7, marginBottom: 8 }}>
              O GPTW aponta o diagnóstico. Na Mendonça & Co construímos o Código de Cultura, os rituais e o sistema de liderança que transformam o Trust Index em vantagem competitiva real.
            </Text>
            <Text style={{ color: C.gold, fontSize: 11, fontFamily: "Helvetica-Bold" }}>guilherme@mendonca.co</Text>
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · GPTW · {data}</Text><Text style={S.rodapeT}>{nome}</Text></View>
      </Page>
    </Document>
  );
}
