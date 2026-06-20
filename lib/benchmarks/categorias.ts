export const CATEGORIAS = [
  { id: "varejo", label: "Varejo Físico" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "industria", label: "Indústria" },
  { id: "servicos", label: "Serviços" },
  { id: "saude", label: "Saúde" },
  { id: "educacao", label: "Educação" },
  { id: "agronegocio", label: "Agronegócio" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "construcao", label: "Construção" },
  { id: "logistica", label: "Logística" },
  { id: "financeiro", label: "Financeiro" },
  { id: "consultoria", label: "Consultoria" },
] as const;

export const SEGMENTOS = [
  { id: "moda", label: "Moda & Vestuário" },
  { id: "suplementos", label: "Suplementos & Nutrição" },
  { id: "cosmeticos", label: "Cosméticos & Beleza" },
  { id: "alimentacao", label: "Alimentação & Bebidas" },
  { id: "eletronicos", label: "Eletrônicos & Tecnologia" },
  { id: "moveis", label: "Móveis & Decoração" },
  { id: "farmacia", label: "Farmácia & Saúde" },
  { id: "automotivo", label: "Automotivo" },
  { id: "pet", label: "Pet" },
  { id: "esportes", label: "Esportes & Fitness" },
  { id: "infantil", label: "Infantil & Brinquedos" },
  { id: "casa_jardim", label: "Casa & Jardim" },
  { id: "servicos_b2b", label: "Serviços B2B" },
  { id: "servicos_b2c", label: "Serviços B2C" },
  { id: "logistica_transp", label: "Logística & Transporte" },
  { id: "construcao_civil", label: "Construção Civil" },
  { id: "agro_insumos", label: "Agro & Insumos" },
  { id: "saude_clinicas", label: "Clínicas & Saúde" },
  { id: "educacao_cursos", label: "Cursos & Treinamentos" },
  { id: "financeiro_contab", label: "Financeiro & Contabilidade" },
] as const;

export type CategoriaId = typeof CATEGORIAS[number]["id"];
export type SegmentoId = typeof SEGMENTOS[number]["id"];

export function labelCategoria(id: string): string {
  return CATEGORIAS.find((c) => c.id === id)?.label ?? id;
}

export function labelSegmento(id: string): string {
  return SEGMENTOS.find((s) => s.id === id)?.label ?? id;
}
