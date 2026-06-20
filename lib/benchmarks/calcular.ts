import { createServiceClient } from "@/lib/supabase/server";

export type SnapshotInput = {
  tipo: string;
  categoria: string | null;
  segmento: string | null;
  porte: string | null;
  metrica: string;
  valor: number;
};

// Calcula médias internas por tipo/categoria/segmento/porte
// e insere em benchmark_snapshots
export async function recalcularBenchmarks(): Promise<{ total: number }> {
  const supabase = createServiceClient();
  const agora = new Date().toISOString();
  const snapshots: SnapshotInput[] = [];

  // ── Q12 ──────────────────────────────────────────────────────
  const { data: q12 } = await supabase
    .from("pesquisas")
    .select("resultado, categoria, segmento, faturamento_faixa")
    .eq("tipo", "q12")
    .not("resultado", "is", null);

  if (q12 && q12.length >= 3) {
    snapshots.push(...calcularMediasPorGrupo(
      q12,
      (r) => (r.resultado as Record<string, number>)?.percentual ?? null,
      "q12",
      "percentual_geral"
    ));
  }

  // ── GPTW ─────────────────────────────────────────────────────
  const { data: gptw } = await supabase
    .from("pesquisas")
    .select("resultado, categoria, segmento, faturamento_faixa")
    .eq("tipo", "gptw")
    .not("resultado", "is", null);

  if (gptw && gptw.length >= 3) {
    snapshots.push(...calcularMediasPorGrupo(
      gptw,
      (r) => (r.resultado as Record<string, number>)?.trustIndex ?? null,
      "gptw",
      "trust_index"
    ));

    // Por dimensão GPTW
    const dims = ["Credibilidade", "Respeito", "Imparcialidade", "Orgulho", "Camaradagem"];
    for (const dim of dims) {
      snapshots.push(...calcularMediasPorGrupo(
        gptw,
        (r) => (r.resultado as Record<string, Record<string, number>>)?.porDimensao?.[dim] ?? null,
        "gptw",
        `dimensao_${dim.toLowerCase()}`
      ));
    }
  }

  // ── Diagnóstico 3D ───────────────────────────────────────────
  const { data: diag } = await supabase
    .from("diagnosticos")
    .select("resultado, categoria, segmento, faturamento_faixa")
    .not("resultado", "is", null);

  if (diag && diag.length >= 3) {
    snapshots.push(...calcularMediasPorGrupo(
      diag,
      (r) => (r.resultado as Record<string, number>)?.geral ?? null,
      "diagnostico_3d",
      "score_geral"
    ));
  }

  // ── Radar 360 ────────────────────────────────────────────────
  const { data: radar } = await supabase
    .from("radar360")
    .select("resultado, categoria, segmento, faturamento_faixa")
    .not("resultado", "is", null);

  if (radar && radar.length >= 3) {
    snapshots.push(...calcularMediasPorGrupo(
      radar,
      (r) => (r.resultado as Record<string, number>)?.geral ?? null,
      "radar_360",
      "score_geral"
    ));
  }

  if (snapshots.length === 0) return { total: 0 };

  // Deletar snapshots anteriores e inserir novos
  await supabase.from("benchmark_snapshots").delete().lt("calculado_em", agora);

  await supabase.from("benchmark_snapshots").insert(
    snapshots.map((s) => ({ ...s, calculado_em: agora }))
  );

  return { total: snapshots.length };
}

type RegistroComGrupo = {
  resultado: unknown;
  categoria?: string | null;
  segmento?: string | null;
  faturamento_faixa?: string | null;
};

function calcularMediasPorGrupo(
  registros: RegistroComGrupo[],
  extrairValor: (r: RegistroComGrupo) => number | null,
  tipo: string,
  metrica: string
): SnapshotInput[] {
  const snapshots: SnapshotInput[] = [];

  // Geral (sem filtro)
  const valoresGeral = registros.map(extrairValor).filter((v) => v != null) as number[];
  if (valoresGeral.length >= 3) {
    snapshots.push({
      tipo, categoria: null, segmento: null, porte: null, metrica,
      valor: media(valoresGeral),
    });
  }

  // Por categoria
  const categorias = Array.from(new Set(registros.map((r) => r.categoria).filter(Boolean))) as string[];
  for (const cat of categorias) {
    const grupo = registros.filter((r) => r.categoria === cat);
    const vals = grupo.map(extrairValor).filter((v) => v != null) as number[];
    if (vals.length >= 3) {
      snapshots.push({ tipo, categoria: cat, segmento: null, porte: null, metrica, valor: media(vals) });
    }
  }

  // Por segmento
  const segmentos = Array.from(new Set(registros.map((r) => r.segmento).filter(Boolean))) as string[];
  for (const seg of segmentos) {
    const grupo = registros.filter((r) => r.segmento === seg);
    const vals = grupo.map(extrairValor).filter((v) => v != null) as number[];
    if (vals.length >= 3) {
      snapshots.push({ tipo, categoria: null, segmento: seg, porte: null, metrica, valor: media(vals) });
    }
  }

  // Por porte
  const portes = Array.from(new Set(registros.map((r) => r.faturamento_faixa).filter(Boolean))) as string[];
  for (const porte of portes) {
    const grupo = registros.filter((r) => r.faturamento_faixa === porte);
    const vals = grupo.map(extrairValor).filter((v) => v != null) as number[];
    if (vals.length >= 3) {
      snapshots.push({ tipo, categoria: null, segmento: null, porte, metrica, valor: media(vals) });
    }
  }

  return snapshots;
}

function media(vals: number[]): number {
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// Buscar benchmark para exibição no resultado
export async function buscarBenchmark({
  tipo, metrica, categoria, segmento, porte,
}: {
  tipo: string;
  metrica: string;
  categoria?: string | null;
  segmento?: string | null;
  porte?: string | null;
}): Promise<{ valor: number; fonte: "interno" | "referencia"; total_amostras?: number; label: string } | null> {
  const supabase = createServiceClient();

  // 1. Tenta snapshot interno (mais específico primeiro)
  const filtros = [
    { categoria: categoria ?? null, segmento: segmento ?? null, porte: porte ?? null },
    { categoria: categoria ?? null, segmento: null, porte: null },
    { categoria: null, segmento: segmento ?? null, porte: null },
    { categoria: null, segmento: null, porte: porte ?? null },
    { categoria: null, segmento: null, porte: null },
  ];

  for (const f of filtros) {
    let q = supabase.from("benchmark_snapshots").select("*").eq("tipo", tipo).eq("metrica", metrica);
    if (f.categoria) q = q.eq("categoria", f.categoria); else q = q.is("categoria", null);
    if (f.segmento) q = q.eq("segmento", f.segmento); else q = q.is("segmento", null);
    if (f.porte) q = q.eq("porte", f.porte); else q = q.is("porte", null);
    const { data } = await q.order("calculado_em", { ascending: false }).limit(1).maybeSingle();
    if (data && data.total_amostras >= 3) {
      const label = f.categoria
        ? `média do setor ${f.categoria}`
        : f.segmento ? `média do segmento ${f.segmento}`
        : f.porte ? `média do porte ${f.porte}`
        : "média geral da base";
      return { valor: data.valor, fonte: "interno", total_amostras: data.total_amostras, label };
    }
  }

  // 2. Fallback: referência de mercado
  let qRef = supabase.from("benchmark_referencias").select("*").eq("tipo", tipo).eq("metrica", metrica);
  if (categoria) qRef = qRef.or(`categoria.eq.${categoria},categoria.is.null`);
  const { data: refs } = await qRef.order("ano", { ascending: false }).limit(1).maybeSingle();
  if (refs) {
    return { valor: refs.valor, fonte: "referencia", label: `referência de mercado (${refs.fonte}, ${refs.ano})` };
  }

  return null;
}
