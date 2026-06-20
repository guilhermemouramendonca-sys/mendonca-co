import {
  Document, Page, Text, View, StyleSheet,
  Svg, Polygon, Line, Circle,
} from "@react-pdf/renderer";
import {
  DIMENSOES, ResultadoRadar360, corScore, labelScore, getAcoesRadar,
  type DimensaoId,
} from "@/lib/radar360/dimensoes";

const CORES = {
  primary: "#0D2B2E", gold: "#C9A84C", goldLight: "#E8D5A3",
  bg: "#F5F0E8", text: "#1A1A1A", muted: "#6B6B6B",
  success: "#2D6A4F", danger: "#C0392B", white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { backgroundColor: CORES.white, fontFamily: "Helvetica", padding: 0 },
  capa: { backgroundColor: CORES.primary, flex: 1, padding: 60, justifyContent: "space-between" },
  pagina: { padding: 50, flex: 1 },
  secaoTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 6 },
  secaoSub: { fontSize: 11, color: CORES.muted, marginBottom: 20 },
  rodape: { position: "absolute", bottom: 24, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between" },
  rodapeText: { fontSize: 9, color: CORES.muted },
});

// ── RADAR CHART 8 EIXOS ──────────────────────────────────────
const CX = 155, CY = 140, R = 95;
const N = 8;

function radarAngle(i: number) {
  return -Math.PI / 2 + i * (2 * Math.PI / N);
}

function radarPt(i: number, norm: number) {
  const a = radarAngle(i);
  return { x: CX + R * norm * Math.cos(a), y: CY + R * norm * Math.sin(a) };
}

function polyPoints(scores: number[]) {
  return scores.map((s, i) => {
    const p = radarPt(i, s / 5);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

function gridPoints(norm: number) {
  return Array.from({ length: N }, (_, i) => {
    const p = radarPt(i, norm);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

// Label offsets per axis (manual tuning for 8 positions)
const LABEL_OFFSETS: { dx: number; dy: number }[] = [
  { dx: -22, dy: -10 }, // top (0: estrategia)
  { dx: 4,   dy: -8  }, // top-right (1: lideranca)
  { dx: 6,   dy: -4  }, // right (2: cultura)
  { dx: 4,   dy: 4   }, // bottom-right (3: gestao)
  { dx: -22, dy: 6   }, // bottom (4: processos)
  { dx: -52, dy: 4   }, // bottom-left (5: marketing)
  { dx: -56, dy: -4  }, // left (6: vendas)
  { dx: -52, dy: -8  }, // top-left (7: financeiro)
];

function RadarChart8({ scores }: { scores: number[] }) {
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const fillColor = corScore(Math.round(avgScore));

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={310} height={280} viewBox="0 0 310 280">
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1.0].map((lv, i) => (
          <Polygon
            key={i}
            points={gridPoints(lv)}
            fill="none"
            stroke={lv === 1.0 ? CORES.goldLight : "#E8D5A3"}
            strokeWidth={lv === 1.0 ? 1.2 : 0.6}
            strokeDasharray={lv < 1.0 ? "3 3" : "0"}
          />
        ))}
        {/* Axes */}
        {Array.from({ length: N }, (_, i) => {
          const tip = radarPt(i, 1.0);
          return <Line key={i} x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={CORES.goldLight} strokeWidth={0.8} />;
        })}
        {/* Score polygon */}
        <Polygon
          points={polyPoints(scores)}
          fill={fillColor + "28"}
          stroke={fillColor}
          strokeWidth={2}
        />
        {/* Score dots */}
        {scores.map((s, i) => {
          const p = radarPt(i, s / 5);
          return <Circle key={i} cx={p.x} cy={p.y} r={4} fill={corScore(s)} stroke={CORES.white} strokeWidth={1.5} />;
        })}
        <Circle cx={CX} cy={CY} r={3} fill={CORES.muted} />
      </Svg>

      {/* Labels sobre o SVG */}
      {DIMENSOES.map((d, i) => {
        const tip = radarPt(i, 1.18);
        const off = LABEL_OFFSETS[i];
        return (
          <View
            key={d.id}
            style={{
              position: "absolute",
              left: tip.x + off.dx,
              top: tip.y + off.dy,
            }}
          >
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: corScore(scores[i]) }}>
              {d.titulo}
            </Text>
            <Text style={{ fontSize: 7, color: CORES.muted }}>
              {scores[i]}/5
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── BARRA DE SCORE ───────────────────────────────────────────
function BarraDim({ titulo, score }: { titulo: string; score: number }) {
  const cor = corScore(score);
  const label = labelScore(score);
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text style={{ fontSize: 10, color: CORES.text }}>{titulo}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 8, color: cor }}>{label}</Text>
          <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary }}>{score}/5</Text>
        </View>
      </View>
      <View style={{ height: 7, backgroundColor: "#E8D5A3", borderRadius: 4 }}>
        <View style={{ height: 7, borderRadius: 4, width: `${(score / 5) * 100}%`, backgroundColor: cor }} />
      </View>
    </View>
  );
}

// ── PORTA DE ENTRADA ─────────────────────────────────────────
const PORTA_DESC: Record<ResultadoRadar360["portaEntrada"], string> = {
  Estratégica: "A empresa não tem direção clara. O trabalho começa por aqui: visão, posicionamento e plano estratégico.",
  Liderança:   "O plano existe, mas o líder ou time sênior ainda não está pronto para executar o próximo estágio.",
  Cultura:     "Estratégia e liderança estão presentes, mas falta a cultura que sustenta a execução no longo prazo.",
  Gestão:      "A empresa precisa de um modelo de gestão estruturado: KPIs, processos, rituais e governança.",
};

// ── PROPS ────────────────────────────────────────────────────
type Props = {
  nome: string;
  empresa?: string | null;
  cargo?: string | null;
  faturamento?: string | null;
  resultado: ResultadoRadar360;
  data: string;
};

const FAT_LABELS: Record<string, string> = {
  ate_7m: "Até R$7M/ano", "7m_30m": "R$7M a R$30M/ano",
  "30m_100m": "R$30M a R$100M/ano", acima_100m: "Acima de R$100M/ano",
};

export function Radar360PDF({ nome, empresa, cargo, faturamento, resultado, data }: Props) {
  const scores = DIMENSOES.map((d) => resultado.scores[d.id]);
  const geralStr = resultado.geral.toFixed(1);
  const corGeral = corScore(Math.round(resultado.geral));
  const labelGeral = labelScore(Math.round(resultado.geral));

  // Dimensões ordenadas do menor para o maior (prioridade)
  const dimsOrdenadas = [...DIMENSOES].sort((a, b) => resultado.scores[a.id] - resultado.scores[b.id]);
  const prioritarias = dimsOrdenadas.filter((d) => resultado.scores[d.id] <= 3);
  const consolidar = dimsOrdenadas.filter((d) => resultado.scores[d.id] >= 4);

  return (
    <Document>
      {/* ── PÁG 1: CAPA ──────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.capa}>
          <View>
            <Text style={{ color: CORES.gold, fontSize: 36, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
              Mendonça & Co
            </Text>
            <Text style={{ color: CORES.goldLight, fontSize: 14, opacity: 0.8 }}>
              Consultoria de Board e Cultura Organizacional
            </Text>
          </View>
          <View>
            <Text style={{ color: CORES.goldLight, fontSize: 11, marginBottom: 8 }}>RADAR DE DIAGNÓSTICO 360</Text>
            <View style={{ width: 60, height: 2, backgroundColor: CORES.gold, marginVertical: 20 }} />
            <Text style={{ color: CORES.white, fontSize: 22, fontFamily: "Helvetica-Bold" }}>{nome}</Text>
            {(cargo || empresa) && (
              <Text style={{ color: CORES.goldLight, fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                {[cargo, empresa].filter(Boolean).join(" · ")}
              </Text>
            )}
            {faturamento && (
              <Text style={{ color: CORES.goldLight, fontSize: 10, marginTop: 3, opacity: 0.6 }}>
                {FAT_LABELS[faturamento] ?? faturamento}
              </Text>
            )}
            <Text style={{ color: CORES.goldLight, fontSize: 11, marginTop: 6, opacity: 0.7 }}>{data}</Text>
          </View>
          <Text style={{ color: CORES.goldLight, fontSize: 10, opacity: 0.5 }}>
            Documento confidencial · mendonca.co
          </Text>
        </View>
      </Page>

      {/* ── PÁG 2: VISÃO GERAL + RADAR ───────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Visão Geral</Text>
          <Text style={styles.secaoSub}>Resultado das 8 dimensões do negócio</Text>

          <View style={{ flexDirection: "row", gap: 16 }}>
            {/* Coluna esquerda: score + barras */}
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: CORES.bg, borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 9, color: CORES.muted, marginBottom: 4 }}>Score Geral</Text>
                <Text style={{ fontSize: 42, fontFamily: "Helvetica-Bold", color: CORES.primary }}>{geralStr}</Text>
                <Text style={{ fontSize: 11, color: corGeral, fontFamily: "Helvetica-Bold" }}>{labelGeral}</Text>
                <Text style={{ fontSize: 9, color: CORES.muted, marginTop: 2 }}>média de 8 dimensões</Text>
              </View>
              {DIMENSOES.map((d) => (
                <BarraDim key={d.id} titulo={d.titulo} score={resultado.scores[d.id]} />
              ))}
            </View>

            {/* Coluna direita: radar chart */}
            <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 8, textAlign: "center" }}>
                Perfil 360
              </Text>
              <RadarChart8 scores={scores} />
            </View>
          </View>
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Radar 360</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁG 3: PORTA DE ENTRADA ──────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Porta de Entrada</Text>
          <Text style={styles.secaoSub}>Por onde o processo começa, baseado no seu diagnóstico</Text>

          {/* Destaque da porta */}
          <View style={{ backgroundColor: CORES.primary, borderRadius: 10, padding: 24, marginBottom: 24 }}>
            <Text style={{ color: CORES.goldLight, fontSize: 10, marginBottom: 6 }}>ENTRADA IDENTIFICADA</Text>
            <Text style={{ color: CORES.gold, fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>
              Entrada {resultado.portaEntrada}
            </Text>
            <Text style={{ color: CORES.white, fontSize: 11, lineHeight: 1.7 }}>
              {PORTA_DESC[resultado.portaEntrada]}
            </Text>
          </View>

          {/* As 4 portas com destaque */}
          {(["Estratégica", "Liderança", "Cultura", "Gestão"] as ResultadoRadar360["portaEntrada"][]).map((porta) => {
            const ativa = porta === resultado.portaEntrada;
            return (
              <View key={porta} style={{
                flexDirection: "row", gap: 12, marginBottom: 10, padding: 12,
                backgroundColor: ativa ? CORES.gold + "18" : CORES.bg,
                borderRadius: 8, borderWidth: ativa ? 1.5 : 0, borderColor: ativa ? CORES.gold : "transparent",
              }}>
                <View style={{
                  width: 8, borderRadius: 4,
                  backgroundColor: ativa ? CORES.gold : CORES.goldLight,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: ativa ? CORES.primary : CORES.muted, marginBottom: 3 }}>
                    Entrada {porta} {ativa ? "← você está aqui" : ""}
                  </Text>
                  <Text style={{ fontSize: 9, color: ativa ? CORES.text : CORES.muted, lineHeight: 1.5 }}>
                    {PORTA_DESC[porta]}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Dimensões críticas */}
          {resultado.zonaCritica.length > 0 && (
            <View style={{ marginTop: 16, backgroundColor: "#C0392B10", borderRadius: 8, padding: 14, borderLeftWidth: 3, borderLeftColor: CORES.danger }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.danger, marginBottom: 6 }}>
                Dimensões em zona crítica (score 1-2) — ação imediata necessária
              </Text>
              <Text style={{ fontSize: 10, color: CORES.text }}>
                {resultado.zonaCritica.map((id) => DIMENSOES.find((d) => d.id === id)?.titulo).join(", ")}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Radar 360</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁG 4: PLANO DE AÇÃO ─────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Plano de Ação</Text>
          <Text style={styles.secaoSub}>Dimensões prioritárias — menores scores primeiro</Text>

          {prioritarias.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <View style={{ width: 4, height: 14, backgroundColor: CORES.danger, borderRadius: 2 }} />
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary }}>
                  Foco imediato — dimensões com score ≤ 3
                </Text>
              </View>
              {prioritarias.map((d, i) => {
                const score = resultado.scores[d.id];
                const cor = corScore(score);
                const acoes = getAcoesRadar(d.id as DimensaoId, score);
                return (
                  <View key={d.id} style={{ marginBottom: 12, backgroundColor: CORES.bg, borderRadius: 8, padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: cor, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: CORES.white }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary }}>{d.titulo}</Text>
                        <Text style={{ fontSize: 8, color: cor }}>{score}/5 — {labelScore(score)}</Text>
                      </View>
                    </View>
                    {acoes.map((acao, j) => (
                      <View key={j} style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                        <Text style={{ fontSize: 9, color: cor, marginTop: 1 }}>▸</Text>
                        <Text style={{ flex: 1, fontSize: 9, color: CORES.text, lineHeight: 1.5 }}>{acao}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {consolidar.length > 0 && (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View style={{ width: 4, height: 14, backgroundColor: CORES.success, borderRadius: 2 }} />
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary }}>
                  Consolidar — manter e expandir o que já funciona
                </Text>
              </View>
              {consolidar.slice(0, 3).map((d) => {
                const score = resultado.scores[d.id];
                const acoes = getAcoesRadar(d.id as DimensaoId, score);
                return (
                  <View key={d.id} style={{ flexDirection: "row", gap: 8, marginBottom: 8, padding: 10, backgroundColor: CORES.bg, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: corScore(score), marginTop: 2 }}>{score}/5</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 2 }}>{d.titulo}</Text>
                      <Text style={{ fontSize: 9, color: CORES.text, lineHeight: 1.5 }}>▸ {acoes[0]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Radar 360</Text>
          <Text style={styles.rodapeText}>{nome} · {data}</Text>
        </View>
      </Page>

      {/* ── PÁG 5: CTA ───────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pagina}>
          <Text style={styles.secaoTitle}>Próximos Passos</Text>
          <Text style={styles.secaoSub}>O que fazer com este diagnóstico</Text>

          <View style={{ backgroundColor: CORES.bg, borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 8 }}>
              O que este Radar revela
            </Text>
            <Text style={{ fontSize: 10, color: CORES.text, lineHeight: 1.7 }}>
              O Radar 360 é o primeiro passo do nosso processo. Ele mostra onde a empresa está hoje —
              com clareza, sem julgamento. As dimensões com menor score não são fraquezas permanentes:
              são a agenda de trabalho do próximo estágio.
            </Text>
          </View>

          <View style={{ backgroundColor: CORES.bg, borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 12 }}>
              O processo completo — 12 passos, 4 blocos, 6 a 18 meses
            </Text>
            {[
              { n: "Bloco 1", t: "Diagnóstico 360", d: "Mapa completo da realidade: externo, interno, liderança e cultura." },
              { n: "Bloco 2", t: "Sistema Estratégico", d: "Visão, posicionamento, código de cultura, modelo de gestão e plano." },
              { n: "Bloco 3", t: "Sistema Humano", d: "Desenvolvimento do fundador, alinhamento de sócios, rituais de execução." },
              { n: "Bloco 4", t: "Sustentação e Domínio", d: "Acompanhamento contínuo até a empresa operar com autonomia." },
            ].map((b) => (
              <View key={b.n} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                <View style={{ width: 56, alignItems: "center", justifyContent: "flex-start", paddingTop: 2 }}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: CORES.gold }}>{b.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES.primary, marginBottom: 2 }}>{b.t}</Text>
                  <Text style={{ fontSize: 9, color: CORES.muted, lineHeight: 1.5 }}>{b.d}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: CORES.primary, borderRadius: 8, padding: 24 }}>
            <Text style={{ color: CORES.gold, fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
              Quer aprofundar este diagnóstico?
            </Text>
            <Text style={{ color: CORES.goldLight, fontSize: 10, lineHeight: 1.7, marginBottom: 12 }}>
              O Radar 360 é o ponto de partida. Na Mentoria 3D construímos juntos o sistema que faz o plano funcionar —
              com disciplina, direção e domínio.
            </Text>
            <Text style={{ color: CORES.gold, fontSize: 11, fontFamily: "Helvetica-Bold" }}>
              guilherme@mendonca.co
            </Text>
          </View>
        </View>
        <View style={styles.rodape}>
          <Text style={styles.rodapeText}>Mendonça & Co · Radar 360 · {data}</Text>
          <Text style={styles.rodapeText}>{nome}</Text>
        </View>
      </Page>
    </Document>
  );
}
