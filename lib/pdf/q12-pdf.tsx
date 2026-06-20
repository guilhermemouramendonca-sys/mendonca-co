import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResultadoQ12 } from "@/lib/pesquisas/q12";

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

const DIM_DESC: Record<string, string> = {
  "Necessidades Básicas": "Clareza de papel e acesso aos recursos para executar o trabalho.",
  "Suporte Individual":   "Reconhecimento, cuidado com a pessoa e suporte ao desenvolvimento.",
  "Trabalho em Equipe":   "Senso de pertencimento, relevância do trabalho e comprometimento coletivo.",
  "Crescimento":          "Progresso percebido, feedback e oportunidades de aprendizado.",
};

const DIM_ACOES: Record<string, Record<string, string[]>> = {
  "Necessidades Básicas": {
    baixo: [
      "Realize uma reunião com cada pessoa para alinhar expectativas e entregas — muitos não sabem exatamente o que é esperado.",
      "Mapeie os recursos que faltam para o time executar bem. Eliminar fricções operacionais é responsabilidade da liderança.",
    ],
    medio: [
      "Documente as responsabilidades de cada papel de forma clara e acessível.",
      "Crie um processo regular de feedback sobre recursos e obstáculos.",
    ],
    alto: [
      "Mantenha a clareza de papéis em momentos de mudança — é quando mais se perde.",
      "Compartilhe as boas práticas de estruturação com outros líderes da organização.",
    ],
  },
  "Suporte Individual": {
    baixo: [
      "Inicie 1-on-1s mensais com cada pessoa: o que está indo bem? O que trava? Como posso ajudar?",
      "Pratique reconhecimento específico e frequente — agradeça publicamente ações concretas, não genéricas.",
    ],
    medio: [
      "Pergunte a cada pessoa: 'Você sente que me importo com você como pessoa?' A resposta pode surpreender.",
      "Crie um plano de desenvolvimento individual para cada membro do time.",
    ],
    alto: [
      "Eleve o padrão: o que faria o suporte individual ser memorável, não só adequado?",
      "Ensine sua abordagem de liderança de pessoas para gestores do time.",
    ],
  },
  "Trabalho em Equipe": {
    baixo: [
      "Comunique a missão e o impacto do trabalho de cada pessoa — por que o que eles fazem importa?",
      "Implante rituais de time: daily, retrospectiva semanal, celebração de conquistas.",
    ],
    medio: [
      "Crie fóruns onde as opiniões do time são genuinamente consideradas nas decisões.",
      "Invista em conexão humana: atividades fora do operacional fortalecem o time.",
    ],
    alto: [
      "Meça o engajamento do time regularmente e aja sobre os dados com transparência.",
      "Celebre o que o time construiu coletivamente — reconhecimento de grupo fortalece pertencimento.",
    ],
  },
  "Crescimento": {
    baixo: [
      "Implante feedbacks estruturados semestrais com planos de desenvolvimento concretos.",
      "Crie pelo menos 1 oportunidade de aprendizado por trimestre para cada pessoa do time.",
    ],
    medio: [
      "Torne o crescimento visível: mostre às pessoas o que aprenderam e como evoluíram.",
      "Conecte as tarefas do dia a dia ao desenvolvimento de longo prazo de cada um.",
    ],
    alto: [
      "Construa trilhas de carreira claras — as pessoas precisam ver aonde podem chegar.",
      "Crie um programa de mentoria interna: quem é sênior pode desenvolver quem é júnior.",
    ],
  },
};

function getNivelDim(pct: number) {
  if (pct >= 70) return "alto";
  if (pct >= 40) return "medio";
  return "baixo";
}

function corDim(pct: number) {
  if (pct >= 70) return C.success;
  if (pct >= 40) return C.gold;
  return pct >= 20 ? C.warning : C.danger;
}

function labelDim(pct: number) {
  if (pct >= 80) return "Alto Engajamento";
  if (pct >= 60) return "Engajamento Moderado";
  if (pct >= 40) return "Baixo Engajamento";
  return "Crítico";
}

const DIMS_ORDER = ["Necessidades Básicas", "Suporte Individual", "Trabalho em Equipe", "Crescimento"];

type Props = { nome: string; empresa?: string | null; cargo?: string | null; resultado: ResultadoQ12; data: string };

export function Q12PDF({ nome, empresa, cargo, resultado, data }: Props) {
  const { percentual, porDimensao, nivel, cor } = resultado;

  const dimsOrdenadas = DIMS_ORDER
    .map((d) => ({ dim: d, pct: Math.round(porDimensao[d] ?? 0) }))
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
            <Text style={{ color: C.goldLight, fontSize: 11, marginBottom: 8 }}>PESQUISA DE ENGAJAMENTO Q12</Text>
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
          <Text style={S.title}>Resultado de Engajamento</Text>
          <Text style={S.sub}>Baseado nas 12 perguntas do método Gallup Q12</Text>

          {/* Score geral */}
          <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 20, alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Índice de Engajamento</Text>
            <Text style={{ fontSize: 52, fontFamily: "Helvetica-Bold", color: C.primary }}>{percentual}%</Text>
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: cor }}>{nivel}</Text>
            <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
              {resultado.media.toFixed(1)}/5 média nas 12 questões
            </Text>
          </View>

          {/* Barras por dimensão */}
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 12 }}>
            Resultado por dimensão
          </Text>
          {DIMS_ORDER.map((dim) => {
            const pct = Math.round(porDimensao[dim] ?? 0);
            const c = corDim(pct);
            return (
              <View key={dim} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                  <Text style={{ fontSize: 10, color: C.text }}>{dim}</Text>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 8, color: c }}>{labelDim(pct)}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary }}>{pct}%</Text>
                  </View>
                </View>
                <View style={{ height: 8, backgroundColor: "#E8D5A3", borderRadius: 4 }}>
                  <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: c }} />
                </View>
                <Text style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>{DIM_DESC[dim]}</Text>
              </View>
            );
          })}
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Q12</Text><Text style={S.rodapeT}>{nome} · {data}</Text></View>
      </Page>

      {/* PÁG 3: PLANO DE AÇÃO */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Plano de Ação</Text>
          <Text style={S.sub}>Dimensões prioritárias — menores índices primeiro</Text>

          {dimsOrdenadas.map((item, i) => {
            const nivel = getNivelDim(item.pct);
            const acoes = DIM_ACOES[item.dim]?.[nivel] ?? [];
            const c = corDim(item.pct);
            return (
              <View key={item.dim} style={{ marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary }}>{item.dim}</Text>
                    <Text style={{ fontSize: 8, color: c }}>{item.pct}% — {labelDim(item.pct)}</Text>
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
              Quer construir uma cultura de alto engajamento?
            </Text>
            <Text style={{ color: C.goldLight, fontSize: 10, lineHeight: 1.7, marginBottom: 8 }}>
              O Q12 mostra onde está o gap. Na Mentoria 3D construímos juntos os rituais de gestão, a cultura e o sistema de liderança que fazem o engajamento crescer de forma sustentável.
            </Text>
            <Text style={{ color: C.gold, fontSize: 11, fontFamily: "Helvetica-Bold" }}>guilherme@mendonca.co</Text>
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · Q12 · {data}</Text><Text style={S.rodapeT}>{nome}</Text></View>
      </Page>
    </Document>
  );
}
