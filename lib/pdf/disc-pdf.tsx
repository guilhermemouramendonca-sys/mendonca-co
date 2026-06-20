import { Document, Page, Text, View, StyleSheet, Svg, Rect } from "@react-pdf/renderer";
import type { ResultadoDISC, FatorDISC } from "@/lib/pesquisas/disc";
import { CORES_DISC } from "@/lib/pesquisas/disc";

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

const DISC_NOMES: Record<FatorDISC, string> = {
  D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade",
};

const DISC_FORTE: Record<FatorDISC, string[]> = {
  D: ["Decisivo e orientado a resultados", "Age com velocidade e determinação", "Gosta de desafios e assume riscos calculados", "Foco em objetivos e soluções"],
  I: ["Comunicativo e persuasivo", "Inspira e engaja pessoas com facilidade", "Otimista e entusiasta", "Cria conexões e relacionamentos com naturalidade"],
  S: ["Paciente, leal e confiável", "Cria ambientes harmoniosos e estáveis", "Colaborativo e consistente", "Excelente ouvinte e suporte para o time"],
  C: ["Analítico, preciso e sistemático", "Garante qualidade e atenção ao detalhe", "Segue processos e busca dados antes de decidir", "Confiável para tarefas que exigem rigor"],
};

const DISC_ATENCAO: Record<FatorDISC, string[]> = {
  D: ["Pode parecer impaciente ou autoritário", "Tende a decidir sem ouvir suficientemente", "Dificuldade em aceitar limite ou perda de controle", "Pode sacrificar qualidade pela velocidade"],
  I: ["Pode priorizar relacionamentos sobre resultados", "Tendência a dispersar atenção em muitas frentes", "Dificuldade com detalhes e acompanhamento", "Pode prometer mais do que entrega"],
  S: ["Pode resistir a mudanças necessárias", "Tende a evitar conflitos mesmo quando necessário", "Dificuldade em dizer 'não' e impor limites", "Lento para se adaptar a novos contextos"],
  C: ["Pode se perder em detalhes e adiar decisões", "Dificuldade em agir sem dados suficientes", "Tendência ao perfeccionismo que trava o avanço", "Pode ser percebido como distante ou crítico"],
};

const DISC_ACOES: Record<FatorDISC, string[]> = {
  D: [
    "Pratique escuta ativa antes de decidir — ouça o time até o fim antes de concluir.",
    "Comunique o 'porquê' das suas decisões para gerar adesão, não só obediência.",
    "Reserve tempo para ouvir perspectivas diferentes das suas — a diversidade de visões melhora a decisão.",
    "Calibre a velocidade: algumas decisões ganham com 24h de reflexão.",
  ],
  I: [
    "Estruture o acompanhamento de compromissos assumidos — use checklists ou CRM pessoal.",
    "Equilibre entusiasmo com execução: defina prazos reais antes de comunicar projetos.",
    "Pratique a comunicação escrita para complementar sua força verbal.",
    "Foque em aprofundar poucas iniciativas antes de iniciar novas.",
  ],
  S: [
    "Pratique comunicação assertiva: expresse discordância de forma direta e respeitosa.",
    "Abrace mudanças como oportunidade — a resistência ao novo é o maior limitador do seu perfil.",
    "Estabeleça limites claros: aprender a dizer 'não' é um ato de liderança, não de egoísmo.",
    "Tome a iniciativa mesmo sem certeza absoluta — a ação perfeita amanhã vale menos que a ação boa hoje.",
  ],
  C: [
    "Estabeleça critérios de 'bom o suficiente' antes de iniciar uma tarefa — evita a paralisia por análise.",
    "Comunique mais e mais cedo: compartilhe o raciocínio antes de ter a resposta final.",
    "Pratique tomada de decisão com 70-80% das informações — esperar 100% raramente é possível.",
    "Flexibilize processos quando o contexto exige — nem toda situação tem um manual.",
  ],
};

const DISC_TRABALHO: Record<FatorDISC, string> = {
  D: "Você performa melhor em ambientes com autonomia, desafios claros e metas de alta performance. Prefere liderar a seguir, e entrega melhor quando tem liberdade para agir. Ambientes muito burocrático ou lentos tendem a frustrar.",
  I: "Você performa melhor em ambientes colaborativos, com pessoas, novidades e reconhecimento frequente. Trabalha melhor com times engajados e líderes que valorizem seu lado comunicativo. Trabalho isolado ou muito repetitivo drena sua energia.",
  S: "Você performa melhor em ambientes estáveis, com clareza de expectativas e relações de confiança. Entrega melhor quando tem tempo para processar, rotinas definidas e um time que valorize colaboração. Mudanças rápidas sem aviso prévio geram estresse.",
  C: "Você performa melhor em ambientes que valorizam qualidade, dados e processos bem definidos. Trabalha melhor com prazos realistas, autonomia para investigar e critérios claros de sucesso. Ambientes caóticos ou que ignoram dados tendem a te frustrar.",
};

type Props = { nome: string; empresa?: string | null; cargo?: string | null; resultado: ResultadoDISC; data: string };

export function DISCPDF({ nome, empresa, cargo, resultado, data }: Props) {
  const { percentual, perfilDominante } = resultado;
  const fatores: FatorDISC[] = ["D", "I", "S", "C"];
  const corDom = CORES_DISC[perfilDominante];

  return (
    <Document>
      {/* PÁG 1: CAPA */}
      <Page size="A4" style={S.page}>
        <View style={S.capa}>
          <View>
            <Text style={{ color: C.gold, fontSize: 36, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>Mendonça & Co</Text>
            <Text style={{ color: C.goldLight, fontSize: 14, opacity: 0.8 }}>Consultoria de Board e Cultura Organizacional</Text>
          </View>
          <View>
            <Text style={{ color: C.goldLight, fontSize: 11, marginBottom: 8 }}>PERFIL COMPORTAMENTAL DISC</Text>
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

      {/* PÁG 2: PERFIL GERAL */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Seu Perfil DISC</Text>
          <Text style={S.sub}>Distribuição dos quatro fatores comportamentais</Text>

          {/* Destaque do perfil dominante */}
          <View style={{ backgroundColor: corDom + "18", borderRadius: 10, padding: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: corDom }}>
            <Text style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>PERFIL DOMINANTE</Text>
            <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: corDom, marginBottom: 6 }}>
              {perfilDominante} — {DISC_NOMES[perfilDominante]}
            </Text>
            <Text style={{ fontSize: 10, color: C.text, lineHeight: 1.7 }}>{resultado.descricao}</Text>
          </View>

          {/* Gráfico de barras horizontais */}
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 12 }}>
            Distribuição por fator
          </Text>
          <Svg width={420} height={130} viewBox="0 0 420 130">
            {fatores.map((f, i) => {
              const barW = (percentual[f] / 100) * 320;
              const y = i * 30;
              return (
                <View key={f}>
                  <Rect x={50} y={y + 4} width={barW} height={20} rx={4} fill={CORES_DISC[f]} />
                  <Rect x={50} y={y + 4} width={320} height={20} rx={4} fill={CORES_DISC[f] + "20"} />
                  <Rect x={50} y={y + 4} width={barW} height={20} rx={4} fill={CORES_DISC[f]} />
                </View>
              );
            })}
          </Svg>
          {/* Labels sobre o SVG */}
          <View style={{ position: "absolute", top: 148, left: 50 }}>
            {fatores.map((f, i) => (
              <View key={f} style={{ flexDirection: "row", alignItems: "center", height: 30, gap: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: CORES_DISC[f], width: 40 }}>
                  {f} — {DISC_NOMES[f].slice(0, 3)}.
                </Text>
                <View style={{ width: (percentual[f] / 100) * 320, height: 20, backgroundColor: CORES_DISC[f], borderRadius: 4, justifyContent: "center", paddingLeft: 6 }}>
                  <Text style={{ fontSize: 9, color: C.white, fontFamily: "Helvetica-Bold" }}>{percentual[f]}%</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tabela dos 4 fatores */}
          <View style={{ marginTop: 150, flexDirection: "row", gap: 8 }}>
            {fatores.map((f) => (
              <View key={f} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 10, alignItems: "center" }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: CORES_DISC[f], alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.white }}>{f}</Text>
                </View>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, textAlign: "center" }}>{DISC_NOMES[f]}</Text>
                <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: CORES_DISC[f], marginTop: 4 }}>{percentual[f]}%</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · DISC</Text><Text style={S.rodapeT}>{nome} · {data}</Text></View>
      </Page>

      {/* PÁG 3: ANÁLISE DO PERFIL DOMINANTE */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>{perfilDominante} — {DISC_NOMES[perfilDominante]}</Text>
          <Text style={S.sub}>Características, pontos de atenção e como trabalhar melhor</Text>

          <View style={{ flexDirection: "row", gap: 14, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: "#27AE6010", borderRadius: 8, padding: 14 }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#27AE60", marginBottom: 8 }}>Seus pontos fortes</Text>
              {DISC_FORTE[perfilDominante].map((p, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 5 }}>
                  <Text style={{ fontSize: 9, color: "#27AE60" }}>✓</Text>
                  <Text style={{ flex: 1, fontSize: 9, color: C.text, lineHeight: 1.5 }}>{p}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1, backgroundColor: "#E67E2210", borderRadius: 8, padding: 14 }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#E67E22", marginBottom: 8 }}>Pontos de atenção</Text>
              {DISC_ATENCAO[perfilDominante].map((p, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 5 }}>
                  <Text style={{ fontSize: 9, color: "#E67E22" }}>▲</Text>
                  <Text style={{ flex: 1, fontSize: 9, color: C.text, lineHeight: 1.5 }}>{p}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ backgroundColor: C.bg, borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 8 }}>Como você trabalha melhor</Text>
            <Text style={{ fontSize: 10, color: C.text, lineHeight: 1.7 }}>{DISC_TRABALHO[perfilDominante]}</Text>
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · DISC</Text><Text style={S.rodapeT}>{nome} · {data}</Text></View>
      </Page>

      {/* PÁG 4: PLANO DE AÇÃO */}
      <Page size="A4" style={S.page}>
        <View style={S.pag}>
          <Text style={S.title}>Plano de Desenvolvimento</Text>
          <Text style={S.sub}>Ações concretas para evoluir como líder com seu perfil {perfilDominante}</Text>

          {DISC_ACOES[perfilDominante].map((acao, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12, marginBottom: 14, backgroundColor: C.bg, borderRadius: 8, padding: 14 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: corDom, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white }}>{i + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 10, color: C.text, lineHeight: 1.7, paddingTop: 3 }}>{acao}</Text>
            </View>
          ))}

          <View style={{ backgroundColor: C.primary, borderRadius: 8, padding: 24, marginTop: 10 }}>
            <Text style={{ color: C.gold, fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
              Quer aprofundar seu autoconhecimento como líder?
            </Text>
            <Text style={{ color: C.goldLight, fontSize: 10, lineHeight: 1.7, marginBottom: 10 }}>
              O DISC é o ponto de partida. Na Mentoria 3D da Mendonça & Co integramos seu perfil comportamental com as dimensões de Disciplina, Direção e Domínio para construir uma liderança de alto impacto.
            </Text>
            <Text style={{ color: C.gold, fontSize: 11, fontFamily: "Helvetica-Bold" }}>guilherme@mendonca.co</Text>
          </View>
        </View>
        <View style={S.rodape}><Text style={S.rodapeT}>Mendonça & Co · DISC · {data}</Text><Text style={S.rodapeT}>{nome}</Text></View>
      </Page>
    </Document>
  );
}
