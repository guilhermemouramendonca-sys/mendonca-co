export type AfirmacaoGPTW = {
  id: number;
  texto: string;
  dimensao: "Credibilidade" | "Respeito" | "Imparcialidade" | "Orgulho" | "Camaradagem";
};

export const AFIRMACOES_GPTW: AfirmacaoGPTW[] = [
  // Credibilidade (comunicação + competência + integridade)
  { id: 1,  texto: "Os líderes comunicam claramente o que esperam de nós.",                                          dimensao: "Credibilidade" },
  { id: 2,  texto: "Posso fazer qualquer pergunta razoável aos líderes e obter uma resposta direta.",                dimensao: "Credibilidade" },
  { id: 3,  texto: "Os líderes desta empresa têm visão clara de para onde a organização está indo.",                 dimensao: "Credibilidade" },
  { id: 4,  texto: "Os líderes cumprem o que prometem.",                                                             dimensao: "Credibilidade" },
  { id: 5,  texto: "Os líderes são competentes para conduzir o negócio.",                                            dimensao: "Credibilidade" },
  // Respeito (suporte + colaboração + cuidado)
  { id: 6,  texto: "Os líderes me oferecem recursos e equipamentos para fazer bem meu trabalho.",                    dimensao: "Respeito" },
  { id: 7,  texto: "Os líderes reconhecem esforço extra e boas contribuições de trabalho.",                          dimensao: "Respeito" },
  { id: 8,  texto: "As pessoas são encorajadas a equilibrar trabalho e vida pessoal.",                               dimensao: "Respeito" },
  { id: 9,  texto: "Os líderes demonstram interesse genuíno em mim como pessoa, não apenas como funcionário.",      dimensao: "Respeito" },
  { id: 10, texto: "Tenho autonomia e responsabilidade na execução do meu trabalho.",                                dimensao: "Respeito" },
  // Imparcialidade (equidade + ausência de discriminação + justiça)
  { id: 11, texto: "As pessoas são pagas de forma justa pelo trabalho que realizam.",                                dimensao: "Imparcialidade" },
  { id: 12, texto: "As promoções vão para quem mais merece.",                                                        dimensao: "Imparcialidade" },
  { id: 13, texto: "Todos têm oportunidade de receber reconhecimento especial.",                                     dimensao: "Imparcialidade" },
  { id: 14, texto: "As pessoas evitam politicagem e bajulação como forma de conseguir o que querem.",               dimensao: "Imparcialidade" },
  { id: 15, texto: "Se sou tratado injustamente, sei que terei uma chance justa de ser ouvido.",                    dimensao: "Imparcialidade" },
  // Orgulho (trabalho individual + equipe + empresa)
  { id: 16, texto: "Sinto que faço diferença por aqui.",                                                             dimensao: "Orgulho" },
  { id: 17, texto: "Meu trabalho tem um significado especial para mim — não é apenas um emprego.",                  dimensao: "Orgulho" },
  { id: 18, texto: "Quando vejo o que realizamos, sinto orgulho do que fazemos.",                                   dimensao: "Orgulho" },
  { id: 19, texto: "As pessoas celebram eventos especiais nesta empresa.",                                           dimensao: "Orgulho" },
  { id: 20, texto: "Tenho orgulho de contar aos outros que trabalho aqui.",                                         dimensao: "Orgulho" },
  // Camaradagem (intimidade + hospitalidade + comunidade)
  { id: 21, texto: "Aqui é um lugar descontraído e agradável para trabalhar.",                                      dimensao: "Camaradagem" },
  { id: 22, texto: "As pessoas aqui se preocupam umas com as outras.",                                              dimensao: "Camaradagem" },
  { id: 23, texto: "Aqui há um sentimento de família ou equipe.",                                                   dimensao: "Camaradagem" },
  { id: 24, texto: "Quando entro em uma área diferente da minha, me sinto bem-vindo.",                              dimensao: "Camaradagem" },
  { id: 25, texto: "Podemos contar uns com os outros para cooperar.",                                               dimensao: "Camaradagem" },
];

export type RespostasGPTW = Record<number, number>; // 1-5

export type ResultadoGPTW = {
  trustIndex: number; // 0-100
  porDimensao: Record<string, number>; // 0-100 por dimensão
  nivel: string;
  cor: string;
};

export function calcularGPTW(respostas: RespostasGPTW): ResultadoGPTW {
  const dimensoes = ["Credibilidade", "Respeito", "Imparcialidade", "Orgulho", "Camaradagem"] as const;

  const porDimensao: Record<string, number> = {};
  for (const dim of dimensoes) {
    const afirms = AFIRMACOES_GPTW.filter((a) => a.dimensao === dim);
    const vals = afirms.map((a) => respostas[a.id]).filter((v) => v !== undefined);
    const media = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    porDimensao[dim] = Math.round(((media - 1) / 4) * 100);
  }

  const trustIndex = Math.round(
    Object.values(porDimensao).reduce((a, b) => a + b, 0) / dimensoes.length
  );

  let nivel: string;
  let cor: string;
  if (trustIndex >= 80) { nivel = "Excelente Lugar para Trabalhar"; cor = "#27AE60"; }
  else if (trustIndex >= 65) { nivel = "Bom Lugar para Trabalhar"; cor = "#C9A84C"; }
  else if (trustIndex >= 50) { nivel = "Em Desenvolvimento"; cor = "#E67E22"; }
  else { nivel = "Necessita Atenção Urgente"; cor = "#C0392B"; }

  return { trustIndex, porDimensao, nivel, cor };
}

export const ESCALA_GPTW = [
  { valor: 1, label: "Quase nunca / Não" },
  { valor: 2, label: "Raramente" },
  { valor: 3, label: "Às vezes" },
  { valor: 4, label: "Frequentemente" },
  { valor: 5, label: "Quase sempre / Sim" },
];
