import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH — atualizar status/nota de um item
export async function PATCH(req: NextRequest) {
  const { itemId, status, nota } = await req.json();
  const supabase = await createClient();

  const update: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (status !== undefined) update.status = status;
  if (nota !== undefined) update.nota = nota;

  const { error } = await supabase
    .from("plano_acao_itens")
    .update(update)
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
