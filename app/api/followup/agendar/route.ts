import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Chamado após cada geração de PDF para agendar follow-ups 30/60/90 dias
export async function POST(req: NextRequest) {
  const { tipo, referenciaId, nome, email, empresa, pdfUrl } = await req.json();

  if (!email || !nome || !tipo || !referenciaId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const supabase = await createClient();
  const hoje = new Date();

  const agendamentos = ([30, 60, 90] as const).map((dias) => {
    const enviarEm = new Date(hoje);
    enviarEm.setDate(enviarEm.getDate() + dias);
    return {
      referencia_tipo: tipo,
      referencia_id: referenciaId,
      nome,
      email,
      empresa: empresa ?? null,
      dias,
      enviar_em: enviarEm.toISOString().split("T")[0],
      pdf_url: pdfUrl ?? null,
    };
  });

  const { error } = await supabase
    .from("followup_agendados")
    .upsert(agendamentos, { onConflict: "referencia_id,dias" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, agendados: agendamentos.length });
}
