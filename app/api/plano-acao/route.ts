import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extrairItensPlano, type TipoPlano } from "@/lib/plano-acao/extrair";

// POST — criar plano de ação
export async function POST(req: NextRequest) {
  const { tipo, referenciaId, nome, email, empresa, resultado } = await req.json();
  const supabase = await createClient();

  // evitar duplicata
  const { data: existente } = await supabase
    .from("planos_acao")
    .select("id")
    .eq("referencia_id", referenciaId)
    .maybeSingle();

  if (existente) return NextResponse.json({ id: existente.id, criado: false });

  const itens = extrairItensPlano(tipo as TipoPlano, resultado);
  if (itens.length === 0) return NextResponse.json({ error: "Sem itens" }, { status: 400 });

  const { data: plano, error } = await supabase
    .from("planos_acao")
    .insert({ tipo, referencia_id: referenciaId, respondente_nome: nome, respondente_email: email, empresa: empresa ?? null })
    .select("id")
    .single();

  if (error || !plano) return NextResponse.json({ error: error?.message }, { status: 500 });

  await supabase.from("plano_acao_itens").insert(
    itens.map((item) => ({
      plano_id: plano.id,
      dimensao: item.dimensao,
      acao: item.acao,
      status: "pendente",
    }))
  );

  return NextResponse.json({ id: plano.id, criado: true });
}
