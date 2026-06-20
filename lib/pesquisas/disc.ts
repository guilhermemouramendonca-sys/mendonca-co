export type FatorDISC = "D" | "I" | "S" | "C";

export type OpcaoDISC = {
  texto: string;
  fator: FatorDISC;
};

export type GrupoDISC = {
  id: number;
  opcoes: OpcaoDISC[];
};

export const GRUPOS_DISC: GrupoDISC[] = [
  { id: 1,  opcoes: [{ texto: "Direto",        fator: "D" }, { texto: "Entusiasmado",  fator: "I" }, { texto: "Gentil",        fator: "S" }, { texto: "Preciso",       fator: "C" }] },
  { id: 2,  opcoes: [{ texto: "Ousado",         fator: "D" }, { texto: "Animado",       fator: "I" }, { texto: "Paciente",      fator: "S" }, { texto: "Meticuloso",    fator: "C" }] },
  { id: 3,  opcoes: [{ texto: "Decisivo",       fator: "D" }, { texto: "Sociável",      fator: "I" }, { texto: "Leal",          fator: "S" }, { texto: "Analítico",     fator: "C" }] },
  { id: 4,  opcoes: [{ texto: "Determinado",    fator: "D" }, { texto: "Otimista",      fator: "I" }, { texto: "Tranquilo",     fator: "S" }, { texto: "Sistemático",   fator: "C" }] },
  { id: 5,  opcoes: [{ texto: "Competitivo",    fator: "D" }, { texto: "Falante",       fator: "I" }, { texto: "Cooperativo",   fator: "S" }, { texto: "Perfeccionista",fator: "C" }] },
  { id: 6,  opcoes: [{ texto: "Audacioso",      fator: "D" }, { texto: "Expressivo",    fator: "I" }, { texto: "Tolerante",     fator: "S" }, { texto: "Cuidadoso",     fator: "C" }] },
  { id: 7,  opcoes: [{ texto: "Independente",   fator: "D" }, { texto: "Persuasivo",    fator: "I" }, { texto: "Amigável",      fator: "S" }, { texto: "Detalhista",    fator: "C" }] },
  { id: 8,  opcoes: [{ texto: "Confiante",      fator: "D" }, { texto: "Carismático",   fator: "I" }, { texto: "Calmo",         fator: "S" }, { texto: "Rigoroso",      fator: "C" }] },
  { id: 9,  opcoes: [{ texto: "Dominante",      fator: "D" }, { texto: "Inspirador",    fator: "I" }, { texto: "Sincero",       fator: "S" }, { texto: "Criterioso",    fator: "C" }] },
  { id: 10, opcoes: [{ texto: "Resoluto",       fator: "D" }, { texto: "Extrovertido",  fator: "I" }, { texto: "Prestativo",    fator: "S" }, { texto: "Disciplinado",  fator: "C" }] },
  { id: 11, opcoes: [{ texto: "Pioneiro",       fator: "D" }, { texto: "Alegre",        fator: "I" }, { texto: "Pacífico",      fator: "S" }, { texto: "Consciente",    fator: "C" }] },
  { id: 12, opcoes: [{ texto: "Firme",          fator: "D" }, { texto: "Impulsivo",     fator: "I" }, { texto: "Empático",      fator: "S" }, { texto: "Objetivo",      fator: "C" }] },
  { id: 13, opcoes: [{ texto: "Exigente",       fator: "D" }, { texto: "Divertido",     fator: "I" }, { texto: "Harmonioso",    fator: "S" }, { texto: "Exato",         fator: "C" }] },
  { id: 14, opcoes: [{ texto: "Forte",          fator: "D" }, { texto: "Comunicativo",  fator: "I" }, { texto: "Discreto",      fator: "S" }, { texto: "Cauteloso",     fator: "C" }] },
  { id: 15, opcoes: [{ texto: "Corajoso",       fator: "D" }, { texto: "Vivaz",         fator: "I" }, { texto: "Confiável",     fator: "S" }, { texto: "Organizado",    fator: "C" }] },
  { id: 16, opcoes: [{ texto: "Ambicioso",      fator: "D" }, { texto: "Espontâneo",    fator: "I" }, { texto: "Estável",       fator: "S" }, { texto: "Lógico",        fator: "C" }] },
  { id: 17, opcoes: [{ texto: "Persistente",    fator: "D" }, { texto: "Popular",       fator: "I" }, { texto: "Dedicado",      fator: "S" }, { texto: "Cético",        fator: "C" }] },
  { id: 18, opcoes: [{ texto: "Arrojado",       fator: "D" }, { texto: "Encantador",    fator: "I" }, { texto: "Apoiador",      fator: "S" }, { texto: "Prudente",      fator: "C" }] },
  { id: 19, opcoes: [{ texto: "Assertivo",      fator: "D" }, { texto: "Motivador",     fator: "I" }, { texto: "Receptivo",     fator: "S" }, { texto: "Minucioso",     fator: "C" }] },
  { id: 20, opcoes: [{ texto: "Controlador",    fator: "D" }, { texto: "Convincente",   fator: "I" }, { texto: "Afável",        fator: "S" }, { texto: "Reservado",     fator: "C" }] },
  { id: 21, opcoes: [{ texto: "Inovador",       fator: "D" }, { texto: "Empolgante",    fator: "I" }, { texto: "Consistente",   fator: "S" }, { texto: "Metódico",      fator: "C" }] },
  { id: 22, opcoes: [{ texto: "Empreendedor",   fator: "D" }, { texto: "Criativo",      fator: "I" }, { texto: "Acolhedor",     fator: "S" }, { texto: "Formal",        fator: "C" }] },
  { id: 23, opcoes: [{ texto: "Incisivo",       fator: "D" }, { texto: "Festivo",       fator: "I" }, { texto: "Colaborativo",  fator: "S" }, { texto: "Sistemático",   fator: "C" }] },
  { id: 24, opcoes: [{ texto: "Decidido",       fator: "D" }, { texto: "Otimista",      fator: "I" }, { texto: "Seguro",        fator: "S" }, { texto: "Analítico",     fator: "C" }] },
  { id: 25, opcoes: [{ texto: "Expedito",       fator: "D" }, { texto: "Entusiasta",    fator: "I" }, { texto: "Contemplativo", fator: "S" }, { texto: "Perfeccionista",fator: "C" }] },
  { id: 26, opcoes: [{ texto: "Dinâmico",       fator: "D" }, { texto: "Interativo",    fator: "I" }, { texto: "Mediador",      fator: "S" }, { texto: "Planejador",    fator: "C" }] },
  { id: 27, opcoes: [{ texto: "Visionário",     fator: "D" }, { texto: "Otimista",      fator: "I" }, { texto: "Compreensivo",  fator: "S" }, { texto: "Conservador",   fator: "C" }] },
  { id: 28, opcoes: [{ texto: "Pragmático",     fator: "D" }, { texto: "Sociável",      fator: "I" }, { texto: "Zeloso",        fator: "S" }, { texto: "Criterioso",    fator: "C" }] },
];

export type RespostasDISC = Record<number, { mais: FatorDISC; menos: FatorDISC }>;

export type ResultadoDISC = {
  perfil: Record<FatorDISC, number>; // 0-28 raw score
  percentual: Record<FatorDISC, number>; // 0-100
  perfilDominante: FatorDISC;
  descricao: string;
};

const DESCRICOES: Record<FatorDISC, string> = {
  D: "Dominância — orientado a resultados, direto, decisivo e competitivo. Gosta de desafios e age com rapidez.",
  I: "Influência — comunicativo, otimista, entusiasta e persuasivo. Valoriza relacionamentos e reconhecimento.",
  S: "Estabilidade — paciente, leal, confiável e colaborativo. Prefere ambientes harmoniosos e previsíveis.",
  C: "Conformidade — analítico, preciso, sistemático e detalhista. Valoriza qualidade, dados e processos.",
};

export function calcularDISC(respostas: RespostasDISC): ResultadoDISC {
  const mais: Record<FatorDISC, number> = { D: 0, I: 0, S: 0, C: 0 };
  const menos: Record<FatorDISC, number> = { D: 0, I: 0, S: 0, C: 0 };

  for (const r of Object.values(respostas)) {
    mais[r.mais]++;
    menos[r.menos]++;
  }

  const perfil: Record<FatorDISC, number> = {
    D: mais.D - menos.D + 14,
    I: mais.I - menos.I + 14,
    S: mais.S - menos.S + 14,
    C: mais.C - menos.C + 14,
  };

  const total = perfil.D + perfil.I + perfil.S + perfil.C;
  const percentual: Record<FatorDISC, number> = {
    D: Math.round((perfil.D / total) * 100),
    I: Math.round((perfil.I / total) * 100),
    S: Math.round((perfil.S / total) * 100),
    C: Math.round((perfil.C / total) * 100),
  };

  const perfilDominante = (["D", "I", "S", "C"] as FatorDISC[]).reduce((a, b) =>
    perfil[a] >= perfil[b] ? a : b
  );

  return { perfil, percentual, perfilDominante, descricao: DESCRICOES[perfilDominante] };
}

export const CORES_DISC: Record<FatorDISC, string> = {
  D: "#C0392B",
  I: "#E67E22",
  S: "#27AE60",
  C: "#2980B9",
};
