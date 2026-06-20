export type PerguntaQ12 = {
  id: number;
  texto: string;
  dimensao: string;
};

export const PERGUNTAS_Q12: PerguntaQ12[] = [
  { id: 1,  texto: "Sei o que é esperado de mim no trabalho.",                                                               dimensao: "Necessidades Básicas" },
  { id: 2,  texto: "Tenho os materiais e equipamentos necessários para fazer meu trabalho corretamente.",                    dimensao: "Necessidades Básicas" },
  { id: 3,  texto: "No trabalho, tenho a oportunidade de fazer o que sei fazer melhor todos os dias.",                       dimensao: "Suporte Individual" },
  { id: 4,  texto: "Nos últimos sete dias, recebi reconhecimento ou elogios por fazer um bom trabalho.",                     dimensao: "Suporte Individual" },
  { id: 5,  texto: "Meu supervisor, ou alguém no trabalho, parece se importar comigo como pessoa.",                          dimensao: "Suporte Individual" },
  { id: 6,  texto: "Há alguém no trabalho que estimula meu desenvolvimento profissional.",                                   dimensao: "Suporte Individual" },
  { id: 7,  texto: "No trabalho, minhas opiniões parecem contar.",                                                           dimensao: "Trabalho em Equipe" },
  { id: 8,  texto: "A missão ou o propósito da minha empresa me faz sentir que meu trabalho é importante.",                 dimensao: "Trabalho em Equipe" },
  { id: 9,  texto: "Meus colegas estão comprometidos em fazer um trabalho de qualidade.",                                    dimensao: "Trabalho em Equipe" },
  { id: 10, texto: "Tenho um melhor amigo no trabalho.",                                                                     dimensao: "Trabalho em Equipe" },
  { id: 11, texto: "Nos últimos seis meses, alguém no trabalho falou comigo sobre meu progresso.",                          dimensao: "Crescimento" },
  { id: 12, texto: "No último ano, tive oportunidades de aprender e crescer no trabalho.",                                   dimensao: "Crescimento" },
];

export type RespostasQ12 = Record<number, number>; // 1-5

export type ResultadoQ12 = {
  media: number; // 1.0 - 5.0
  percentual: number; // 0-100
  porDimensao: Record<string, number>; // média por dimensão
  nivel: string;
  cor: string;
};

export function calcularQ12(respostas: RespostasQ12): ResultadoQ12 {
  const valores = Object.values(respostas);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const percentual = Math.round(((media - 1) / 4) * 100);

  const porDimensao: Record<string, number[]> = {};
  for (const p of PERGUNTAS_Q12) {
    if (!porDimensao[p.dimensao]) porDimensao[p.dimensao] = [];
    if (respostas[p.id] !== undefined) porDimensao[p.dimensao].push(respostas[p.id]);
  }
  const medias: Record<string, number> = {};
  for (const [dim, vals] of Object.entries(porDimensao)) {
    medias[dim] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  let nivel: string;
  let cor: string;
  if (percentual >= 80) { nivel = "Alto Engajamento"; cor = "#27AE60"; }
  else if (percentual >= 60) { nivel = "Engajamento Moderado"; cor = "#C9A84C"; }
  else if (percentual >= 40) { nivel = "Baixo Engajamento"; cor = "#E67E22"; }
  else { nivel = "Desengajamento Crítico"; cor = "#C0392B"; }

  return { media, percentual, porDimensao: medias, nivel, cor };
}

export const ESCALA_Q12 = [
  { valor: 1, label: "Discordo totalmente" },
  { valor: 2, label: "Discordo" },
  { valor: 3, label: "Neutro" },
  { valor: 4, label: "Concordo" },
  { valor: 5, label: "Concordo totalmente" },
];
