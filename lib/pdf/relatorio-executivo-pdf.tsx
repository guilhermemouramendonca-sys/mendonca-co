import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";

// ─── Cores ──────────────────────────────────────────────────────────────────
const C = {
  primary: "#0D2B2E",
  gold: "#C9A84C",
  bg: "#F5F0E8",
  white: "#FFFFFF",
  muted: "#6B6B6B",
  border: "#E8D5A3",
  verde: "#27AE60",
  amarelo: "#E6B800",
  laranja: "#E67E22",
  vermelho: "#C0392B",
};

const styles = StyleSheet.create({
  page: { backgroundColor: C.bg, fontFamily: "Helvetica", padding: 40 },
  // Capa
  capaPage: { backgroundColor: C.primary, padding: 60, justifyContent: "space-between" },
  capaTopLine: { width: 48, height: 3, backgroundColor: C.gold, marginBottom: 40 },
  capaTitulo: { fontSize: 32, fontFamily: "Helvetica-Bold", color: C.gold, lineHeight: 1.2, marginBottom: 12 },
  capaSubtitulo: { fontSize: 14, color: "#FFFFFF80", marginBottom: 40 },
  capaCliente: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white, marginBottom: 4 },
  capaEmpresa: { fontSize: 13, color: C.gold },
  capaBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  capaData: { fontSize: 11, color: "#FFFFFF60" },
  // Seção
  secaoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: 24 },
  secaoBadge: { width: 6, height: 20, backgroundColor: C.gold, borderRadius: 3, marginRight: 10 },
  secaoTitulo: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.primary },
  // Cards
  card: { backgroundColor: C.white, borderRadius: 8, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitulo: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary },
  cardData: { fontSize: 9, color: C.muted },
  // Barra de progresso
  barraContainer: { height: 8, backgroundColor: "#E8D5A3", borderRadius: 4, marginTop: 6 },
  barraFill: { height: 8, borderRadius: 4 },
  // Texto
  label: { fontSize: 9, color: C.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  valor: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.primary },
  valorPequeno: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.primary },
  texto: { fontSize: 10, color: C.muted, lineHeight: 1.5 },
  // Grade
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  // Divisor
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  // Resumo executivo
  resumoCard: { backgroundColor: C.primary, borderRadius: 8, padding: 20, marginBottom: 16 },
  resumoTitulo: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.gold, marginBottom: 10 },
  resumoItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  resumoBullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginRight: 8 },
  resumoTexto: { fontSize: 10, color: "#FFFFFFCC", lineHeight: 1.4, flex: 1 },
  // Rodapé
  rodape: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  rodapeTexto: { fontSize: 8, color: C.muted },
});

function corScore(v: number, max = 100): string {
  const pct = (v / max) * 100;
  if (pct >= 70) return C.verde;
  if (pct >= 50) return C.amarelo;
  if (pct >= 30) return C.laranja;
  return C.vermelho;
}

function nivelTexto(v: number, max = 100): string {
  const pct = (v / max) * 100;
  if (pct >= 70) return "Alto";
  if (pct >= 50) return "Médio-alto";
  if (pct >= 30) return "Médio-baixo";
  return "Baixo";
}

function BarraMetrica({ valor, max = 100, cor }: { valor: number; max?: number; cor: string }) {
  const pct = Math.min((valor / max) * 100, 100);
  return (
    <View style={styles.barraContainer}>
      <View style={[styles.barraFill, { width: `${pct}%`, backgroundColor: cor }]} />
    </View>
  );
}

function Rodape({ page, total }: { page: number; total: number }) {
  return (
    <View style={styles.rodape} fixed>
      <Text style={styles.rodapeTexto}>Mendonça & Co — Confidencial</Text>
      <Text style={styles.rodapeTexto}>{page} / {total}</Text>
    </View>
  );
}

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type DiagnosticoData = {
  tipo: "diagnostico_3d";
  resultado: { geral: number; scores: Record<string, number>; portaEntrada: string };
  criado_em: string;
};

export type Radar360Data = {
  tipo: "radar_360";
  resultado: { geral: number; scores: Record<string, number>; portaEntrada: string };
  criado_em: string;
};

export type PesquisaData = {
  tipo: "disc" | "q12" | "gptw";
  resultado: Record<string, unknown>;
  criado_em: string;
};

export type CanvasData = {
  tipo: "canvas";
  resultado: { respostas: Record<string, string>; analise: Record<string, string> };
  concluido_em: string;
};

export type RelatorioExecutivoProps = {
  cliente: { nome: string; empresa?: string; cargo?: string };
  data: string;
  diagnosticos: DiagnosticoData[];
  radar360: Radar360Data[];
  pesquisas: PesquisaData[];
  canvas: CanvasData[];
};

// ─── Documento ──────────────────────────────────────────────────────────────
export function RelatorioExecutivoPDF({
  cliente, data, diagnosticos, radar360, pesquisas, canvas,
}: RelatorioExecutivoProps) {
  const q12s = pesquisas.filter((p) => p.tipo === "q12");
  const gptws = pesquisas.filter((p) => p.tipo === "gptw");
  const discs = pesquisas.filter((p) => p.tipo === "disc");

  const totalFerramentas = diagnosticos.length + radar360.length + pesquisas.length + canvas.length;

  // Resumo executivo: pontos de atenção
  const pontos: string[] = [];
  if (diagnosticos.length > 0) {
    const ultimo = diagnosticos[diagnosticos.length - 1];
    const geral = ultimo.resultado.geral;
    pontos.push(`Diagnóstico 3D: score ${geral.toFixed(1)}/5 — ${nivelTexto(geral, 5)}.`);
    const criticos = Object.entries(ultimo.resultado.scores)
      .filter(([, v]) => v <= 2)
      .map(([k]) => k);
    if (criticos.length > 0) pontos.push(`Dimensões críticas: ${criticos.join(", ")}.`);
  }
  if (q12s.length > 0) {
    const ultimo = q12s[q12s.length - 1];
    const pct = (ultimo.resultado as Record<string, number>).percentual;
    pontos.push(`Engajamento Q12: ${pct}% — ${nivelTexto(pct)}.`);
  }
  if (gptws.length > 0) {
    const ultimo = gptws[gptws.length - 1];
    const ti = (ultimo.resultado as Record<string, number>).trustIndex;
    pontos.push(`Trust Index GPTW: ${ti}% — ${nivelTexto(ti)}.`);
  }

  return (
    <Document>
      {/* ── CAPA ──────────────────────────────────────────────── */}
      <Page size="A4" style={styles.capaPage}>
        <View>
          <View style={styles.capaTopLine} />
          <Text style={styles.capaTitulo}>Relatório Executivo{"\n"}Consolidado</Text>
          <Text style={styles.capaSubtitulo}>{totalFerramentas} diagnóstico{totalFerramentas !== 1 ? "s" : ""} realizados</Text>
        </View>
        <View>
          <Text style={styles.capaCliente}>{cliente.nome}</Text>
          {cliente.empresa && <Text style={styles.capaEmpresa}>{cliente.empresa}{cliente.cargo ? ` · ${cliente.cargo}` : ""}</Text>}
          <View style={{ height: 1, backgroundColor: "#FFFFFF20", marginVertical: 24 }} />
          <View style={styles.capaBottom}>
            <Text style={styles.capaData}>Gerado em {data}</Text>
            <Text style={{ fontSize: 11, color: C.gold }}>Mendonça & Co</Text>
          </View>
        </View>
      </Page>

      {/* ── RESUMO EXECUTIVO ──────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.secaoHeader}>
          <View style={styles.secaoBadge} />
          <Text style={styles.secaoTitulo}>Resumo Executivo</Text>
        </View>

        {pontos.length > 0 && (
          <View style={styles.resumoCard}>
            <Text style={styles.resumoTitulo}>Principais Achados</Text>
            {pontos.map((p, i) => (
              <View key={i} style={styles.resumoItem}>
                <View style={styles.resumoBullet} />
                <Text style={styles.resumoTexto}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Visão geral das ferramentas */}
        <View style={styles.card}>
          <Text style={[styles.cardTitulo, { marginBottom: 12 }]}>Ferramentas Aplicadas</Text>
          <View style={styles.row}>
            {[
              { label: "Diagnóstico 3D", count: diagnosticos.length },
              { label: "Radar 360", count: radar360.length },
              { label: "Q12", count: q12s.length },
              { label: "GPTW", count: gptws.length },
              { label: "DISC", count: discs.length },
              { label: "Canvas", count: canvas.length },
            ].filter((f) => f.count > 0).map((f) => (
              <View key={f.label} style={[styles.col, { alignItems: "center" }]}>
                <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: C.primary }}>{f.count}</Text>
                <Text style={[styles.label, { textAlign: "center" }]}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.texto, { textAlign: "center", color: C.muted }]}>
          Este relatório consolida todos os diagnósticos realizados e deve ser interpretado em conjunto{"\n"}
          com o Plano de Ação gerado pela Mendonça & Co.
        </Text>

        <Rodape page={2} total={2 + (diagnosticos.length > 0 ? 1 : 0) + (radar360.length > 0 ? 1 : 0) + (q12s.length > 0 ? 1 : 0) + (gptws.length > 0 ? 1 : 0) + (canvas.length > 0 ? 1 : 0)} />
      </Page>

      {/* ── DIAGNÓSTICO 3D ─────────────────────────────────────── */}
      {diagnosticos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.secaoHeader}>
            <View style={styles.secaoBadge} />
            <Text style={styles.secaoTitulo}>Diagnóstico 3D</Text>
          </View>

          {diagnosticos.map((d, i) => {
            const geral = d.resultado.geral;
            const cor = corScore(geral, 5);
            return (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitulo}>
                    {i === diagnosticos.length - 1 ? "Mais recente" : `Aplicação ${i + 1}`}
                  </Text>
                  <Text style={styles.cardData}>{new Date(d.criado_em).toLocaleDateString("pt-BR")}</Text>
                </View>
                <View style={styles.row}>
                  <View style={[styles.col, { alignItems: "center", maxWidth: 80 }]}>
                    <Text style={[styles.valor, { color: cor }]}>{geral.toFixed(1)}</Text>
                    <Text style={styles.label}>Score Geral /5</Text>
                  </View>
                  <View style={{ flex: 3 }}>
                    {Object.entries(d.resultado.scores).map(([dim, score]) => {
                      const c = corScore(score, 5);
                      return (
                        <View key={dim} style={{ marginBottom: 5 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={styles.texto}>{dim}</Text>
                            <Text style={[styles.texto, { fontFamily: "Helvetica-Bold", color: c }]}>{score}/5</Text>
                          </View>
                          <BarraMetrica valor={score} max={5} cor={c} />
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
          <Rodape page={3} total={99} />
        </Page>
      )}

      {/* ── RADAR 360 ──────────────────────────────────────────── */}
      {radar360.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.secaoHeader}>
            <View style={styles.secaoBadge} />
            <Text style={styles.secaoTitulo}>Radar de Diagnóstico 360</Text>
          </View>

          {radar360.map((r, i) => {
            const geral = r.resultado.geral;
            const cor = corScore(geral, 5);
            return (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitulo}>{i === radar360.length - 1 ? "Mais recente" : `Aplicação ${i + 1}`}</Text>
                  <Text style={styles.cardData}>{new Date(r.criado_em).toLocaleDateString("pt-BR")}</Text>
                </View>
                <View style={styles.row}>
                  <View style={[styles.col, { alignItems: "center", maxWidth: 80 }]}>
                    <Text style={[styles.valor, { color: cor }]}>{geral.toFixed(1)}</Text>
                    <Text style={styles.label}>Score Geral /5</Text>
                  </View>
                  <View style={{ flex: 3 }}>
                    {Object.entries(r.resultado.scores).slice(0, 8).map(([dim, score]) => {
                      const c = corScore(score, 5);
                      return (
                        <View key={dim} style={{ marginBottom: 4 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={[styles.texto, { fontSize: 9 }]}>{dim}</Text>
                            <Text style={[styles.texto, { fontFamily: "Helvetica-Bold", color: c, fontSize: 9 }]}>{score}/5</Text>
                          </View>
                          <BarraMetrica valor={score} max={5} cor={c} />
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
          <Rodape page={4} total={99} />
        </Page>
      )}

      {/* ── Q12 + GPTW ─────────────────────────────────────────── */}
      {(q12s.length > 0 || gptws.length > 0) && (
        <Page size="A4" style={styles.page}>
          {q12s.length > 0 && (
            <>
              <View style={styles.secaoHeader}>
                <View style={styles.secaoBadge} />
                <Text style={styles.secaoTitulo}>Pesquisa de Engajamento Q12</Text>
              </View>
              {q12s.map((q, i) => {
                const pct = (q.resultado as Record<string, number>).percentual ?? 0;
                const cor = corScore(pct);
                return (
                  <View key={i} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitulo}>{i === q12s.length - 1 ? "Mais recente" : `Aplicação ${i + 1}`}</Text>
                      <Text style={styles.cardData}>{new Date(q.criado_em).toLocaleDateString("pt-BR")}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <Text style={[styles.valor, { color: cor }]}>{pct}%</Text>
                      <View style={{ flex: 1 }}>
                        <BarraMetrica valor={pct} cor={cor} />
                        <Text style={[styles.label, { marginTop: 4 }]}>{nivelTexto(pct)} engajamento</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {gptws.length > 0 && (
            <>
              <View style={[styles.secaoHeader, { marginTop: q12s.length > 0 ? 16 : 0 }]}>
                <View style={styles.secaoBadge} />
                <Text style={styles.secaoTitulo}>Trust Index GPTW</Text>
              </View>
              {gptws.map((g, i) => {
                const ti = (g.resultado as Record<string, number>).trustIndex ?? 0;
                const cor = corScore(ti);
                const dims = (g.resultado as Record<string, Record<string, number>>).porDimensao ?? {};
                return (
                  <View key={i} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitulo}>{i === gptws.length - 1 ? "Mais recente" : `Aplicação ${i + 1}`}</Text>
                      <Text style={styles.cardData}>{new Date(g.criado_em).toLocaleDateString("pt-BR")}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ alignItems: "center", minWidth: 70 }}>
                        <Text style={[styles.valor, { color: cor }]}>{ti}%</Text>
                        <Text style={styles.label}>Trust Index</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        {Object.entries(dims).map(([dim, val]) => {
                          const c = corScore(val as number);
                          return (
                            <View key={dim} style={{ marginBottom: 4 }}>
                              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={[styles.texto, { fontSize: 9 }]}>{dim}</Text>
                                <Text style={[styles.texto, { color: c, fontSize: 9, fontFamily: "Helvetica-Bold" }]}>{val as number}%</Text>
                              </View>
                              <BarraMetrica valor={val as number} cor={c} />
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
          <Rodape page={5} total={99} />
        </Page>
      )}

      {/* ── CANVAS ─────────────────────────────────────────────── */}
      {canvas.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.secaoHeader}>
            <View style={styles.secaoBadge} />
            <Text style={styles.secaoTitulo}>Canvas Estratégico</Text>
          </View>
          {canvas.map((cv, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitulo}>{i === canvas.length - 1 ? "Mais recente" : `Aplicação ${i + 1}`}</Text>
                <Text style={styles.cardData}>{new Date(cv.concluido_em).toLocaleDateString("pt-BR")}</Text>
              </View>
              {Object.entries(cv.resultado.analise ?? {}).slice(0, 3).map(([key, analise]) => (
                <View key={key} style={{ marginBottom: 8 }}>
                  <Text style={[styles.label, { marginBottom: 2 }]}>{key}</Text>
                  <Text style={styles.texto}>{(analise as string).slice(0, 200)}{(analise as string).length > 200 ? "…" : ""}</Text>
                </View>
              ))}
            </View>
          ))}
          <Rodape page={6} total={99} />
        </Page>
      )}
    </Document>
  );
}
