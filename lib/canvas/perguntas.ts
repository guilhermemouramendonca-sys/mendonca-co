export type CanvasId =
  | "proposito"
  | "mercado"
  | "modelo"
  | "gargalos"
  | "time"
  | "proximo_movimento";

export type RespostasCanvas = Partial<Record<CanvasId, string>>;

export type ResultadoCanvas = {
  respostas: Record<CanvasId, string>;
  analise: Record<CanvasId, string>;
};

export const PERGUNTAS_CANVAS: {
  id: CanvasId;
  titulo: string;
  pergunta: string;
  placeholder: string;
  icone: string;
  cor: string;
}[] = [
  {
    id: "proposito",
    titulo: "Propósito & Direção",
    pergunta: "Qual é o propósito da sua empresa e onde você quer chegar nos próximos 3 anos?",
    placeholder: "Ex: Somos uma empresa de tecnologia agrícola que em 3 anos quer ser referência no agronegócio do Centro-Oeste, com R$50M de faturamento e presença em 5 estados.",
    icone: "🎯",
    cor: "#0D2B2E",
  },
  {
    id: "mercado",
    titulo: "Mercado & Posicionamento",
    pergunta: "Quem é seu cliente ideal e como você se diferencia da concorrência hoje?",
    placeholder: "Ex: Atendemos distribuidores com faturamento entre R$10M e R$50M. Nos diferenciamos pela velocidade de entrega e atendimento personalizado, algo que os grandes fornecedores não oferecem.",
    icone: "🎪",
    cor: "#2980B9",
  },
  {
    id: "modelo",
    titulo: "Modelo de Negócio",
    pergunta: "Como a empresa gera receita hoje? Quais são seus principais produtos, serviços ou fontes de valor?",
    placeholder: "Ex: 70% da receita vem de contratos recorrentes de manutenção. 30% de projetos pontuais. Margens maiores estão nos contratos, mas dependemos demais de 3 clientes grandes.",
    icone: "💡",
    cor: "#8E44AD",
  },
  {
    id: "gargalos",
    titulo: "Principais Gargalos",
    pergunta: "Quais são os 2 ou 3 maiores obstáculos que impedem a empresa de crescer mais rápido agora?",
    placeholder: "Ex: 1. Falta de processo comercial — dependemos do fundador para fechar vendas. 2. Operação sobrecarregada — crescimento travado pela capacidade do time. 3. Fluxo de caixa com prazos longos de recebimento.",
    icone: "⚠️",
    cor: "#E67E22",
  },
  {
    id: "time",
    titulo: "Time & Liderança",
    pergunta: "Como está o time de liderança hoje? Quais lacunas de pessoas ou cultura você identifica?",
    placeholder: "Ex: Tenho um time técnico forte, mas falta liderança comercial. A cultura ainda é muito operacional — a equipe executa bem mas não pensa estrategicamente. Preciso desenvolver gestores de nível médio.",
    icone: "👥",
    cor: "#27AE60",
  },
  {
    id: "proximo_movimento",
    titulo: "Próximo Movimento",
    pergunta: "Qual é a decisão mais importante que você precisa tomar nos próximos 90 dias?",
    placeholder: "Ex: Contratar um diretor comercial para desatrelar as vendas de mim. Isso desbloquearia crescimento e me daria espaço para pensar estratégia em vez de operar.",
    icone: "🚀",
    cor: "#C9A84C",
  },
];

export function gerarAnaliseCanvas(respostas: Record<CanvasId, string>): Record<CanvasId, string> {
  // Análise baseada no tamanho e conteúdo das respostas
  // Na prática, respostas longas indicam mais clareza; curtas indicam lacuna
  const analise: Record<CanvasId, string> = {} as Record<CanvasId, string>;

  const palavrasChavePositivas: Record<CanvasId, string[]> = {
    proposito: ["meta", "objetivo", "prazo", "número", "ano", "crescer", "chegar", "faturamento", "mercado"],
    mercado: ["cliente", "diferenci", "concorrência", "nicho", "segmento", "posicion", "valor"],
    modelo: ["receita", "margin", "produto", "serviço", "recorrente", "contrato", "cliente"],
    gargalos: ["processo", "time", "capital", "vendas", "operac", "caixa", "contratar"],
    time: ["liderança", "cultura", "gestor", "contratar", "desenvolver", "time", "equipe"],
    proximo_movimento: ["contratar", "decidir", "implementar", "lançar", "estruturar", "definir", "90", "mês"],
  };

  for (const q of PERGUNTAS_CANVAS) {
    const resposta = respostas[q.id] ?? "";
    const palavras = resposta.toLowerCase();
    const tamanho = resposta.trim().length;
    const chavesPresentes = palavrasChavePositivas[q.id].filter((k) => palavras.includes(k)).length;

    let analiseTexto = "";

    if (tamanho < 50) {
      analiseTexto = `A resposta indica que ainda há oportunidade de clareza sobre ${q.titulo.toLowerCase()}. Desenvolver essa dimensão com mais detalhe costuma revelar alavancas importantes.`;
    } else if (chavesPresentes >= 3) {
      analiseTexto = `Boa clareza sobre ${q.titulo.toLowerCase()}. A resposta indica consciência dos elementos-chave, o que facilita o desenho de estratégias concretas.`;
    } else {
      analiseTexto = `A resposta aponta para ${q.titulo.toLowerCase()}, mas pode se beneficiar de mais especificidade — números, prazos e critérios claros tornam a estratégia executável.`;
    }

    analise[q.id] = analiseTexto;
  }

  return analise;
}
