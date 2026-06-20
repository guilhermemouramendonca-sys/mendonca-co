import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

const PRIMARY = "#0D2B2E";
const GOLD = "#C9A84C";
const BG = "#F5F0E8";
const MUTED = "#6B7280";
const WHITE = "#FFFFFF";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", backgroundColor: BG, padding: 0 },

  // Capa
  capa: { backgroundColor: PRIMARY, height: "100%", padding: 60, justifyContent: "space-between" },
  capaTop: {},
  capaTag: { color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  capaTitulo: { color: WHITE, fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 },
  capaEmpresa: { color: GOLD, fontSize: 18, fontWeight: 600 },
  capaProspect: { color: WHITE, fontSize: 13, opacity: 0.7, marginTop: 4 },
  capaBottom: {},
  capaLinha: { height: 1, backgroundColor: GOLD, opacity: 0.3, marginBottom: 24 },
  capaRemetente: { color: WHITE, fontSize: 12, fontWeight: 600 },
  capaData: { color: WHITE, fontSize: 10, opacity: 0.6, marginTop: 4 },
  capaValidade: { color: GOLD, fontSize: 10, marginTop: 8 },

  // Páginas internas
  interno: { padding: "48 56", flex: 1 },
  cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 36, paddingBottom: 16, borderBottom: `1 solid ${GOLD}` },
  cabecalhoMarca: { color: PRIMARY, fontSize: 14, fontWeight: 700 },
  cabecalhoPag: { color: MUTED, fontSize: 9 },

  secaoTitulo: { color: GOLD, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  h2: { color: PRIMARY, fontSize: 20, fontWeight: 700, marginBottom: 8 },
  body: { color: "#374151", fontSize: 11, lineHeight: 1.7 },
  muted: { color: MUTED, fontSize: 10, lineHeight: 1.6 },

  // Cards
  cardRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  card: { flex: 1, backgroundColor: WHITE, borderRadius: 8, padding: 16, border: `1 solid #E5E7EB` },
  cardLabel: { color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  cardValor: { color: PRIMARY, fontSize: 14, fontWeight: 700 },
  cardSub: { color: MUTED, fontSize: 9, marginTop: 3 },

  // Tabela de escopo
  tabelaHeader: { flexDirection: "row", backgroundColor: PRIMARY, borderRadius: 6, padding: "8 12", marginTop: 20 },
  tabelaHeaderText: { color: GOLD, fontSize: 9, fontWeight: 700, textTransform: "uppercase" },
  tabelaLinha: { flexDirection: "row", padding: "10 12", borderBottom: `1 solid #F3F4F6` },
  tabelaLinhaAlt: { flexDirection: "row", padding: "10 12", backgroundColor: WHITE, borderBottom: `1 solid #F3F4F6` },
  col1: { flex: 2 },
  col2: { flex: 1 },

  // Investimento
  investimentoBox: { backgroundColor: PRIMARY, borderRadius: 10, padding: 28, marginTop: 24, alignItems: "center" },
  investimentoLabel: { color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  investimentoValor: { color: WHITE, fontSize: 32, fontWeight: 700 },
  investimentoCond: { color: WHITE, fontSize: 11, opacity: 0.7, marginTop: 6 },

  // Próximos passos
  passoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14, gap: 12 },
  passoBadge: { backgroundColor: GOLD, borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  passoBadgeText: { color: PRIMARY, fontSize: 11, fontWeight: 700 },
  passoTexto: { flex: 1, color: "#374151", fontSize: 11, lineHeight: 1.6, paddingTop: 3 },

  // Rodapé
  rodape: { flexDirection: "row", justifyContent: "space-between", marginTop: 40, paddingTop: 16, borderTop: `1 solid #E5E7EB` },
  rodapeText: { color: MUTED, fontSize: 9 },
});

export type PropostaData = {
  numero: number;
  nomeProspect: string;
  empresa?: string;
  email?: string;
  servico: string;
  descricao?: string;
  valor?: number;
  condicaoPagamento?: string;
  validadeDias: number;
  observacoes?: string;
  dataEmissao: string;
};

const SERVICOS: Record<string, { label: string; descricao: string; entregaveis: string[] }> = {
  mentoria_3d: {
    label: "Mentoria Estratégica 3D",
    descricao: "Processo estruturado de mentoria executiva com foco nas três dimensões críticas do negócio: Estratégia, Gestão de Pessoas e Resultado Financeiro.",
    entregaveis: [
      "Diagnóstico inicial das 3 dimensões (3D)",
      "8 sessões mensais de 90 minutos",
      "Plano de ação personalizado por dimensão",
      "Relatório executivo consolidado",
      "Acesso à plataforma de acompanhamento",
    ],
  },
  diagnostico_board: {
    label: "Diagnóstico Board",
    descricao: "Avaliação completa da organização através de múltiplos instrumentos científicos, gerando um mapa claro das forças, gaps e prioridades de desenvolvimento.",
    entregaveis: [
      "Diagnóstico 3D (Estratégia, Pessoas e Resultado)",
      "Radar 360° de liderança",
      "Pesquisa de clima Q12 (Gallup)",
      "Canvas Estratégico facilitado",
      "Relatório executivo consolidado em PDF",
      "Sessão de devolutiva com a liderança",
    ],
  },
  palestra: {
    label: "Palestra / Workshop",
    descricao: "Conteúdo transformador para sua equipe ou evento corporativo, com abordagem prática e cases reais de gestão e liderança.",
    entregaveis: [
      "Palestra customizada ao tema e público",
      "Material de apoio para participantes",
      "Dinâmicas e exercícios práticos",
      "Sessão de Q&A",
      "Relatório de percepções pós-evento",
    ],
  },
  mentoria_expressa: {
    label: "Mentoria Expressa",
    descricao: "Sessão focada e estratégica para resolver um desafio específico do negócio ou acelerar uma decisão crítica.",
    entregaveis: [
      "2 sessões de 2 horas",
      "Análise do desafio apresentado",
      "Plano de ação com próximos passos",
      "Acompanhamento por 30 dias via WhatsApp",
    ],
  },
};

function formatValor(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function dataValidade(emissao: string, dias: number) {
  const d = new Date(emissao);
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function PropostaPDF({ proposta }: { proposta: PropostaData }) {
  const servicoInfo = SERVICOS[proposta.servico] ?? {
    label: proposta.servico,
    descricao: proposta.descricao ?? "",
    entregaveis: [],
  };
  const numFormatado = String(proposta.numero).padStart(3, "0");
  const anoAtual = new Date(proposta.dataEmissao).getFullYear();

  return (
    <Document>
      {/* ── CAPA ─────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.capa}>
          <View style={s.capaTop}>
            <Text style={s.capaTag}>Proposta Comercial · {numFormatado}/{anoAtual}</Text>
            <Text style={s.capaTitulo}>{servicoInfo.label}</Text>
            <Text style={s.capaEmpresa}>{proposta.empresa ?? proposta.nomeProspect}</Text>
            {proposta.empresa && (
              <Text style={s.capaProspect}>Att.: {proposta.nomeProspect}</Text>
            )}
          </View>
          <View style={s.capaBottom}>
            <View style={s.capaLinha} />
            <Text style={s.capaRemetente}>Mendonça & Co</Text>
            <Text style={s.capaData}>Emitida em {formatData(proposta.dataEmissao)}</Text>
            <Text style={s.capaValidade}>
              Válida até {dataValidade(proposta.dataEmissao, proposta.validadeDias)}
            </Text>
          </View>
        </View>
      </Page>

      {/* ── APRESENTAÇÃO + CONTEXTO ───────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.interno}>
          <View style={s.cabecalho}>
            <Text style={s.cabecalhoMarca}>Mendonça & Co</Text>
            <Text style={s.cabecalhoPag}>Proposta {numFormatado}/{anoAtual}</Text>
          </View>

          <Text style={s.secaoTitulo}>Sobre esta proposta</Text>
          <Text style={s.h2}>Nossa solução para {proposta.empresa ?? proposta.nomeProspect}</Text>
          <Text style={s.body}>
            {proposta.descricao && proposta.descricao.length > 10
              ? proposta.descricao
              : servicoInfo.descricao}
          </Text>

          {/* Cards resumo */}
          <View style={s.cardRow}>
            <View style={s.card}>
              <Text style={s.cardLabel}>Solução</Text>
              <Text style={s.cardValor}>{servicoInfo.label}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Empresa</Text>
              <Text style={s.cardValor}>{proposta.empresa ?? "—"}</Text>
              {proposta.email && <Text style={s.cardSub}>{proposta.email}</Text>}
            </View>
            <View style={s.card}>
              <Text style={s.cardLabel}>Validade</Text>
              <Text style={s.cardValor}>{proposta.validadeDias} dias</Text>
              <Text style={s.cardSub}>a partir da emissão</Text>
            </View>
          </View>

          <View style={s.rodape}>
            <Text style={s.rodapeText}>Mendonça & Co · Consultoria, Conselho & Educação</Text>
            <Text style={s.rodapeText}>guilherme@mendoncaeco.com</Text>
          </View>
        </View>
      </Page>

      {/* ── ESCOPO + ENTREGÁVEIS ───────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.interno}>
          <View style={s.cabecalho}>
            <Text style={s.cabecalhoMarca}>Mendonça & Co</Text>
            <Text style={s.cabecalhoPag}>Escopo & Entregáveis</Text>
          </View>

          <Text style={s.secaoTitulo}>O que está incluído</Text>
          <Text style={s.h2}>Escopo detalhado</Text>
          <Text style={s.body}>
            A seguir, todos os entregáveis previstos no escopo desta proposta. Qualquer customização
            adicional pode ser discutida antes da assinatura do contrato.
          </Text>

          <View style={s.tabelaHeader}>
            <View style={s.col1}><Text style={s.tabelaHeaderText}>Entregável</Text></View>
            <View style={s.col2}><Text style={s.tabelaHeaderText}>Incluso</Text></View>
          </View>

          {servicoInfo.entregaveis.map((e, i) => (
            <View key={i} style={i % 2 === 0 ? s.tabelaLinhaAlt : s.tabelaLinha}>
              <View style={s.col1}><Text style={s.body}>{e}</Text></View>
              <View style={s.col2}><Text style={{ ...s.body, color: "#16A34A", fontWeight: 600 }}>✓ Sim</Text></View>
            </View>
          ))}

          {proposta.observacoes && (
            <>
              <Text style={{ ...s.secaoTitulo, marginTop: 28 }}>Observações</Text>
              <Text style={s.body}>{proposta.observacoes}</Text>
            </>
          )}

          <View style={s.rodape}>
            <Text style={s.rodapeText}>Mendonça & Co · Consultoria, Conselho & Educação</Text>
            <Text style={s.rodapeText}>Proposta {numFormatado}/{anoAtual}</Text>
          </View>
        </View>
      </Page>

      {/* ── INVESTIMENTO + PRÓXIMOS PASSOS ────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.interno}>
          <View style={s.cabecalho}>
            <Text style={s.cabecalhoMarca}>Mendonça & Co</Text>
            <Text style={s.cabecalhoPag}>Investimento & Próximos Passos</Text>
          </View>

          <Text style={s.secaoTitulo}>Investimento</Text>
          <Text style={s.h2}>Valores</Text>

          {proposta.valor ? (
            <View style={s.investimentoBox}>
              <Text style={s.investimentoLabel}>Investimento Total</Text>
              <Text style={s.investimentoValor}>{formatValor(proposta.valor)}</Text>
              {proposta.condicaoPagamento && (
                <Text style={s.investimentoCond}>{proposta.condicaoPagamento}</Text>
              )}
            </View>
          ) : (
            <View style={{ ...s.investimentoBox, backgroundColor: "#F3F4F6" }}>
              <Text style={{ ...s.investimentoLabel, color: MUTED }}>Investimento</Text>
              <Text style={{ ...s.investimentoValor, color: PRIMARY }}>A combinar</Text>
              <Text style={{ ...s.investimentoCond, color: MUTED }}>
                Entre em contato para discutirmos o melhor formato
              </Text>
            </View>
          )}

          <Text style={{ ...s.secaoTitulo, marginTop: 36 }}>Próximos passos</Text>
          <Text style={{ ...s.h2, fontSize: 16, marginBottom: 20 }}>Como avançamos juntos</Text>

          {[
            "Análise desta proposta pela sua equipe",
            "Reunião de alinhamento e ajustes (se necessário)",
            "Assinatura do contrato e definição de datas",
            "Kick-off do projeto",
          ].map((passo, i) => (
            <View key={i} style={s.passoRow}>
              <View style={s.passoBadge}>
                <Text style={s.passoBadgeText}>{i + 1}</Text>
              </View>
              <Text style={s.passoTexto}>{passo}</Text>
            </View>
          ))}

          <View style={{ backgroundColor: WHITE, borderRadius: 8, padding: 20, marginTop: 20, border: `1 solid #E5E7EB` }}>
            <Text style={{ ...s.body, fontWeight: 600, marginBottom: 4 }}>Guilherme Mendonça</Text>
            <Text style={s.muted}>Diretor · Mendonça & Co</Text>
            <Text style={s.muted}>guilherme@mendoncaeco.com</Text>
          </View>

          <View style={s.rodape}>
            <Text style={s.rodapeText}>
              Válida até {dataValidade(proposta.dataEmissao, proposta.validadeDias)}
            </Text>
            <Text style={s.rodapeText}>Proposta {numFormatado}/{anoAtual}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
