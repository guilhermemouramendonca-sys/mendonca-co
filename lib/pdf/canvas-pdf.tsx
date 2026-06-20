import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CanvasId, ResultadoCanvas } from "@/lib/canvas/perguntas";
import { PERGUNTAS_CANVAS } from "@/lib/canvas/perguntas";

const C = {
  primary: "#0D2B2E", gold: "#C9A84C", goldLight: "#E8D5A3",
  bg: "#F5F0E8", text: "#1A1A1A", muted: "#6B6B6B", white: "#FFFFFF",
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

type Props = {
  nome: string;
  empresa?: string | null;
  cargo?: string | null;
  resultado: ResultadoCanvas;
  data: string;
};

export function CanvasPDF({ nome, empresa, cargo, resultado, data }: Props) {
  const { respostas, analise } = resultado;

  // Divide as 6 perguntas em 2 páginas de 3
  const metade1 = PERGUNTAS_CANVAS.slice(0, 3);
  const metade2 = PERGUNTAS_CANVAS.slice(3, 6);

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
            <Text style={{ color: C.goldLight, fontSize: 11, marginBottom: 8 }}>CANVAS ESTRATÉGICO</Text>
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

      {/* PÁG 2: Canvas parte 1 */}
      <CanvasPage perguntas={metade1} respostas={respostas} nome={nome} data={data} numPag={2} />

      {/* PÁG 3: Canvas parte 2 */}
      <CanvasPage perguntas={metade2} respostas={respostas} nome={nome} data={data} numPag={3} />

      {/* PÁG 4: Análise */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Análise do Canvas</Text>
          <Text style={S.sub}>Leitura estratégica por dimensão</Text>

          {PERGUNTAS_CANVAS.map((q) => (
            <View key={q.id} style={{ marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: q.cor, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 11 }}>{q.icone}</Text>
                </View>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary }}>{q.titulo}</Text>
              </View>
              <Text style={{ fontSize: 9, color: C.text, lineHeight: 1.6 }}>{analise[q.id as CanvasId]}</Text>
            </View>
          ))}
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Canvas Estratégico</Text><Text style={S.rodapeT}>{nome} · {data}</Text></View>
      </Page>

      {/* PÁG 5: CTA */}
      <Page size="A4" style={S.page}>
        <View style={{ backgroundColor: C.primary, flex: 1, padding: 60, justifyContent: "center" }}>
          <Text style={{ color: C.gold, fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 16 }}>
            O Canvas é o diagnóstico.
          </Text>
          <Text style={{ color: C.goldLight, fontSize: 16, lineHeight: 1.8, marginBottom: 40 }}>
            A estratégia começa quando você tem clareza sobre onde está, onde quer chegar, e o que precisa mudar para chegar lá.
          </Text>

          <View style={{ width: 60, height: 2, backgroundColor: C.gold, marginBottom: 40 }} />

          <Text style={{ color: C.white, fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 12 }}>
            Na Mendonça & Co trabalhamos com os fundadores e CEOs de PMEs para:
          </Text>
          {[
            "Construir uma estratégia clara com metas, iniciativas e KPIs",
            "Montar o time e a cultura que sustenta o crescimento",
            "Criar os rituais de gestão que fazem a estratégia acontecer",
            "Desenvolver o líder que a empresa precisa ter no próximo nível",
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              <Text style={{ color: C.gold, fontSize: 11 }}>▸</Text>
              <Text style={{ flex: 1, color: C.goldLight, fontSize: 11, lineHeight: 1.6 }}>{item}</Text>
            </View>
          ))}

          <View style={{ marginTop: 40, padding: 20, borderRadius: 8, borderWidth: 1, borderColor: C.gold + "40" }}>
            <Text style={{ color: C.gold, fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>
              Agende uma conversa
            </Text>
            <Text style={{ color: C.goldLight, fontSize: 11 }}>guilherme@mendonca.co</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

type CanvasPageProps = {
  perguntas: typeof PERGUNTAS_CANVAS;
  respostas: Record<CanvasId, string>;
  nome: string;
  data: string;
  numPag: number;
};

function CanvasPage({ perguntas, respostas, nome, data, numPag }: CanvasPageProps) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.pag}>
        <Text style={S.title}>Canvas Estratégico</Text>
        <Text style={S.sub}>{numPag === 2 ? "Parte 1 de 2 — Propósito, Mercado e Modelo" : "Parte 2 de 2 — Gargalos, Time e Próximo Movimento"}</Text>

        {perguntas.map((q) => {
          const resposta = respostas[q.id] ?? "";
          return (
            <View key={q.id} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: q.cor, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13 }}>{q.icone}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary }}>{q.titulo}</Text>
                  <Text style={{ fontSize: 8, color: C.muted }}>{q.pergunta}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: C.bg, borderRadius: 6, padding: 14, minHeight: 60, borderLeftWidth: 3, borderLeftColor: q.cor }}>
                {resposta.trim() ? (
                  <Text style={{ fontSize: 10, color: C.text, lineHeight: 1.7 }}>{resposta}</Text>
                ) : (
                  <Text style={{ fontSize: 10, color: C.muted, fontStyle: "italic" }}>Não preenchido</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Canvas Estratégico</Text><Text style={S.rodapeT}>{nome} · {data}</Text></View>
    </Page>
  );
}
