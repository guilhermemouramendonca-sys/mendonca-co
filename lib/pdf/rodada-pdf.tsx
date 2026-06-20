import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ConsolidadoQ12, ConsolidadoGPTW } from "@/lib/rodadas/consolidar";

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

function corPct(pct: number): string {
  if (pct >= 70) return C.success;
  if (pct >= 50) return C.gold;
  if (pct >= 30) return C.warning;
  return C.danger;
}

function BarraDim({ label, pct, cor }: { label: string; pct: number; cor: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text style={{ fontSize: 10, color: C.text }}>{label}</Text>
        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: cor }}>{pct}%</Text>
      </View>
      <View style={{ height: 8, backgroundColor: "#E8D5A3", borderRadius: 4 }}>
        <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: cor }} />
      </View>
    </View>
  );
}

function Distribuicao({ dist }: { dist: { alto: number; medio: number; baixo: number } }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
      {[
        { label: "Alto", pct: dist.alto, cor: C.success },
        { label: "Médio", pct: dist.medio, cor: C.gold },
        { label: "Baixo", pct: dist.baixo, cor: C.danger },
      ].map((item) => (
        <View key={item.label} style={{ flex: 1, backgroundColor: item.cor + "18", borderRadius: 8, padding: 12, alignItems: "center", borderTopWidth: 3, borderTopColor: item.cor }}>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: item.cor }}>{item.pct}%</Text>
          <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{item.label}</Text>
          <Text style={{ fontSize: 8, color: C.muted }}>dos respondentes</Text>
        </View>
      ))}
    </View>
  );
}

// ── Q12 ──────────────────────────────────────────────────────────

type Q12Props = {
  nome: string;
  empresa?: string | null;
  consolidado: ConsolidadoQ12;
  respondentes: string[];
  data: string;
};

export function RodadaQ12PDF({ nome, empresa, consolidado, respondentes, data }: Q12Props) {
  const { totalRespondentes, percentualGeral, porDimensao, porPergunta, distribuicao, nivel, cor } = consolidado;
  const dims = ["Necessidades Básicas", "Suporte Individual", "Trabalho em Equipe", "Crescimento"];
  const criticas = porPergunta.slice(0, 5); // 5 perguntas com menor score

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
            <Text style={{ color: C.goldLight, fontSize: 11, marginBottom: 8 }}>PESQUISA DE ENGAJAMENTO Q12 · CONSOLIDADO</Text>
            <View style={{ width: 60, height: 2, backgroundColor: C.gold, marginVertical: 20 }} />
            <Text style={{ color: C.white, fontSize: 22, fontFamily: "Helvetica-Bold" }}>{nome}</Text>
            {empresa && <Text style={{ color: C.goldLight, fontSize: 12, marginTop: 4, opacity: 0.8 }}>{empresa}</Text>}
            <Text style={{ color: C.goldLight, fontSize: 11, marginTop: 6, opacity: 0.7 }}>{totalRespondentes} respondentes · {data}</Text>
          </View>
          <Text style={{ color: C.goldLight, fontSize: 10, opacity: 0.5 }}>Documento confidencial · mendonca.co</Text>
        </View>
      </Page>

      {/* PÁG 2: VISÃO GERAL */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Resultado Consolidado</Text>
          <Text style={S.sub}>{totalRespondentes} respondentes · {data}</Text>

          {/* Score geral */}
          <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 20, alignItems: "center", marginBottom: 20, flexDirection: "row", gap: 20 }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Índice de Engajamento</Text>
              <Text style={{ fontSize: 48, fontFamily: "Helvetica-Bold", color: C.primary }}>{percentualGeral}%</Text>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: cor }}>{nivel}</Text>
            </View>
            <View style={{ width: 1, height: 80, backgroundColor: "#E8D5A3" }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.muted, marginBottom: 8 }}>RESPONDENTES</Text>
              <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: C.primary }}>{totalRespondentes}</Text>
              <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>pessoas responderam</Text>
            </View>
          </View>

          {/* Distribuição */}
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 10 }}>Distribuição de engajamento</Text>
          <Distribuicao dist={distribuicao} />

          {/* Por dimensão */}
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 12 }}>Resultado por dimensão</Text>
          {dims.map((dim) => {
            const d = porDimensao[dim];
            if (!d) return null;
            return <BarraDim key={dim} label={dim} pct={d.percentual} cor={corPct(d.percentual)} />;
          })}
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Q12 Consolidado · {nome}</Text><Text style={S.rodapeT}>{data}</Text></View>
      </Page>

      {/* PÁG 3: PERGUNTAS CRÍTICAS */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Perguntas Críticas</Text>
          <Text style={S.sub}>5 afirmações com menor índice de concordância — foco prioritário de ação</Text>

          {criticas.map((p, i) => {
            const c = corPct(p.percentual);
            return (
              <View key={p.id} style={{ marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14, borderLeftWidth: 3, borderLeftColor: c }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: C.muted }}>{p.dimensao}</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: c, marginLeft: "auto" }}>{p.percentual}%</Text>
                </View>
                <Text style={{ fontSize: 10, color: C.text, lineHeight: 1.6 }}>{p.texto}</Text>
                <View style={{ marginTop: 8, height: 6, backgroundColor: "#E8D5A3", borderRadius: 3 }}>
                  <View style={{ height: 6, borderRadius: 3, width: `${p.percentual}%`, backgroundColor: c }} />
                </View>
              </View>
            );
          })}

          <View style={{ backgroundColor: "#E8D5A3" + "50", borderRadius: 8, padding: 14, marginTop: 8 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 6 }}>Como interpretar</Text>
            <Text style={{ fontSize: 9, color: C.text, lineHeight: 1.6 }}>
              Cada afirmação representa um elemento de engajamento do time. Percentuais abaixo de 50% indicam gaps significativos que impactam retenção, produtividade e cultura. Perguntas abaixo de 30% exigem ação imediata.
            </Text>
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Q12 Consolidado · {nome}</Text><Text style={S.rodapeT}>{data}</Text></View>
      </Page>

      {/* PÁG 4: PLANO DE AÇÃO */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Plano de Ação</Text>
          <Text style={S.sub}>Dimensões prioritárias — ordenadas do menor para o maior índice</Text>

          {dims
            .map((dim) => ({ dim, pct: porDimensao[dim]?.percentual ?? 0 }))
            .sort((a, b) => a.pct - b.pct)
            .map((item, i) => {
              const c = corPct(item.pct);
              const acoes = ACOES_Q12[item.dim] ?? [];
              return (
                <View key={item.dim} style={{ marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary, flex: 1 }}>{item.dim}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: c }}>{item.pct}%</Text>
                  </View>
                  {acoes.map((acao, j) => (
                    <View key={j} style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 9, color: c }}>▸</Text>
                      <Text style={{ flex: 1, fontSize: 9, color: C.text, lineHeight: 1.5 }}>{acao}</Text>
                    </View>
                  ))}
                </View>
              );
            })}

          <View style={{ backgroundColor: C.primary, borderRadius: 8, padding: 20, marginTop: 4 }}>
            <Text style={{ color: C.gold, fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Quer construir um time de alto engajamento?</Text>
            <Text style={{ color: C.goldLight, fontSize: 9, lineHeight: 1.7, marginBottom: 6 }}>
              O Q12 revela onde estão os gaps. Na Mendonça & Co construímos os rituais de liderança, a cultura e o sistema de gestão que elevam o engajamento de forma sustentável.
            </Text>
            <Text style={{ color: C.gold, fontSize: 10, fontFamily: "Helvetica-Bold" }}>guilherme@mendoncaeco.com</Text>
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Q12 Consolidado · {data}</Text><Text style={S.rodapeT}>{nome}</Text></View>
      </Page>

      {/* PÁG 5: RESPONDENTES */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Respondentes</Text>
          <Text style={S.sub}>{totalRespondentes} pessoas participaram desta rodada</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {respondentes.map((r, i) => (
              <View key={i} style={{ backgroundColor: C.bg, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 10, color: C.text }}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Q12 Consolidado · {data}</Text><Text style={S.rodapeT}>{nome}</Text></View>
      </Page>
    </Document>
  );
}

// ── GPTW ─────────────────────────────────────────────────────────

type GPTWProps = {
  nome: string;
  empresa?: string | null;
  consolidado: ConsolidadoGPTW;
  respondentes: string[];
  data: string;
};

export function RodadaGPTWPDF({ nome, empresa, consolidado, respondentes, data }: GPTWProps) {
  const { totalRespondentes, trustIndexMedio, porDimensao, porAfirmacao, distribuicao, nivel, cor } = consolidado;
  const dims = ["Credibilidade", "Respeito", "Imparcialidade", "Orgulho", "Camaradagem"];
  const criticas = porAfirmacao.slice(0, 5);

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
            <Text style={{ color: C.goldLight, fontSize: 11, marginBottom: 8 }}>TRUST INDEX GPTW · CONSOLIDADO</Text>
            <View style={{ width: 60, height: 2, backgroundColor: C.gold, marginVertical: 20 }} />
            <Text style={{ color: C.white, fontSize: 22, fontFamily: "Helvetica-Bold" }}>{nome}</Text>
            {empresa && <Text style={{ color: C.goldLight, fontSize: 12, marginTop: 4, opacity: 0.8 }}>{empresa}</Text>}
            <Text style={{ color: C.goldLight, fontSize: 11, marginTop: 6, opacity: 0.7 }}>{totalRespondentes} respondentes · {data}</Text>
          </View>
          <Text style={{ color: C.goldLight, fontSize: 10, opacity: 0.5 }}>Documento confidencial · mendonca.co</Text>
        </View>
      </Page>

      {/* PÁG 2: VISÃO GERAL */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Trust Index Consolidado</Text>
          <Text style={S.sub}>{totalRespondentes} respondentes · {data}</Text>

          <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 20, alignItems: "center", marginBottom: 20, flexDirection: "row", gap: 20 }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Trust Index Médio</Text>
              <Text style={{ fontSize: 48, fontFamily: "Helvetica-Bold", color: C.primary }}>{trustIndexMedio}%</Text>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: cor }}>{nivel}</Text>
            </View>
            <View style={{ width: 1, height: 80, backgroundColor: "#E8D5A3" }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, color: C.muted, marginBottom: 8 }}>RESPONDENTES</Text>
              <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: C.primary }}>{totalRespondentes}</Text>
              <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>pessoas responderam</Text>
            </View>
          </View>

          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 10 }}>Distribuição de confiança</Text>
          <Distribuicao dist={distribuicao} />

          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 12 }}>Trust Index por dimensão</Text>
          {dims.map((dim) => {
            const d = porDimensao[dim];
            if (!d) return null;
            return <BarraDim key={dim} label={dim} pct={d.media} cor={corPct(d.media)} />;
          })}
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · GPTW Consolidado · {nome}</Text><Text style={S.rodapeT}>{data}</Text></View>
      </Page>

      {/* PÁG 3: AFIRMAÇÕES CRÍTICAS */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Afirmações Críticas</Text>
          <Text style={S.sub}>5 afirmações com menor índice de concordância</Text>

          {criticas.map((a, i) => {
            const c = corPct(a.percentual);
            return (
              <View key={a.id} style={{ marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14, borderLeftWidth: 3, borderLeftColor: c }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 8, color: C.muted }}>{a.dimensao}</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: c, marginLeft: "auto" }}>{a.percentual}%</Text>
                </View>
                <Text style={{ fontSize: 10, color: C.text, lineHeight: 1.6 }}>{a.texto}</Text>
                <View style={{ marginTop: 8, height: 6, backgroundColor: "#E8D5A3", borderRadius: 3 }}>
                  <View style={{ height: 6, borderRadius: 3, width: `${a.percentual}%`, backgroundColor: c }} />
                </View>
              </View>
            );
          })}
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · GPTW Consolidado · {nome}</Text><Text style={S.rodapeT}>{data}</Text></View>
      </Page>

      {/* PÁG 4: PLANO DE AÇÃO + RESPONDENTES */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Plano de Ação Cultural</Text>
          <Text style={S.sub}>Dimensões prioritárias — do menor para o maior Trust Index</Text>

          {dims
            .map((dim) => ({ dim, pct: porDimensao[dim]?.media ?? 0 }))
            .sort((a, b) => a.pct - b.pct)
            .slice(0, 3)
            .map((item, i) => {
              const c = corPct(item.pct);
              return (
                <View key={item.dim} style={{ marginBottom: 12, backgroundColor: C.bg, borderRadius: 8, padding: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary, flex: 1 }}>{item.dim}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: c }}>{item.pct}%</Text>
                  </View>
                  {(ACOES_GPTW[item.dim] ?? []).map((acao, j) => (
                    <View key={j} style={{ flexDirection: "row", gap: 6, marginTop: 3 }}>
                      <Text style={{ fontSize: 8, color: c }}>▸</Text>
                      <Text style={{ flex: 1, fontSize: 8, color: C.text, lineHeight: 1.5 }}>{acao}</Text>
                    </View>
                  ))}
                </View>
              );
            })}

          <View style={{ backgroundColor: C.primary, borderRadius: 8, padding: 16, marginTop: 8, marginBottom: 16 }}>
            <Text style={{ color: C.gold, fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Quer transformar o Trust Index em vantagem competitiva?</Text>
            <Text style={{ color: C.goldLight, fontSize: 9, lineHeight: 1.7 }}>
              Na Mendonça & Co construímos o Código de Cultura, os rituais e o sistema de liderança que elevam a confiança do time de forma duradoura.
            </Text>
            <Text style={{ color: C.gold, fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 6 }}>guilherme@mendoncaeco.com</Text>
          </View>

          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 8 }}>Respondentes ({totalRespondentes})</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {respondentes.map((r, i) => (
              <View key={i} style={{ backgroundColor: C.bg, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 8, color: C.text }}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · GPTW Consolidado · {data}</Text><Text style={S.rodapeT}>{nome}</Text></View>
      </Page>
    </Document>
  );
}

// ── Ações por dimensão (inline para o PDF não depender de imports extras) ──

const ACOES_Q12: Record<string, string[]> = {
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

const ACOES_GPTW: Record<string, string[]> = {
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
    "Crie um canal para reportar percepções de injustiça — e responda seriamente.",
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
