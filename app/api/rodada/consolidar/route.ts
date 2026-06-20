import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consolidarQ12, consolidarGPTW, type RespostaIndividual } from "@/lib/rodadas/consolidar";

export async function POST(req: NextRequest) {
  const { rodadaId } = await req.json();
  const supabase = await createClient();

  const { data: rodada } = await supabase
    .from("rodadas")
    .select("*")
    .eq("id", rodadaId)
    .single();

  if (!rodada) return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });

  const { data: pesquisas } = await supabase
    .from("pesquisas")
    .select("id, respondente_nome, respondente_email, respondente_cargo, resultado, respostas, criado_em")
    .eq("rodada_id", rodadaId)
    .not("resultado", "is", null);

  if (!pesquisas || pesquisas.length === 0) {
    return NextResponse.json({ error: "Nenhuma resposta ainda" }, { status: 400 });
  }

  const respostas: RespostaIndividual[] = pesquisas.map((p) => ({
    id: p.id,
    respondente_nome: p.respondente_nome ?? "",
    respondente_email: p.respondente_email ?? "",
    respondente_cargo: p.respondente_cargo ?? undefined,
    resultado: p.resultado ?? {},
    respostas: p.respostas ?? {},
    criado_em: p.criado_em,
  }));

  let consolidado: unknown;
  if (rodada.tipo === "q12") {
    consolidado = consolidarQ12(respostas);
  } else if (rodada.tipo === "gptw") {
    consolidado = consolidarGPTW(respostas);
  } else {
    return NextResponse.json({ error: "Tipo de rodada inválido" }, { status: 400 });
  }

  await supabase.from("rodadas").update({
    resultado_consolidado: consolidado,
    status: "consolidada",
  }).eq("id", rodadaId);

  return NextResponse.json({ consolidado });
}
