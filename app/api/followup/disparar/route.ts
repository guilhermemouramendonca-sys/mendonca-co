import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { enviarEmailFollowup } from "@/lib/email/followup";

// Chamado pelo cron diário — dispara follow-ups do dia
export async function GET() {
  const supabase = createServiceClient();
  const hoje = new Date().toISOString().split("T")[0];

  const { data: pendentes } = await supabase
    .from("followup_agendados")
    .select("*")
    .eq("enviado", false)
    .lte("enviar_em", hoje);

  if (!pendentes || pendentes.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  let enviados = 0;
  const erros: string[] = [];

  for (const f of pendentes) {
    const resultado = await enviarEmailFollowup({
      nome: f.nome,
      email: f.email,
      empresa: f.empresa,
      tipo: f.referencia_tipo,
      dias: f.dias as 30 | 60 | 90,
      pdfUrl: f.pdf_url,
    });

    if (resultado.ok) {
      await supabase
        .from("followup_agendados")
        .update({ enviado: true, enviado_em: new Date().toISOString() })
        .eq("id", f.id);
      enviados++;
    } else {
      erros.push(`${f.email} (${f.dias}d): ${resultado.error}`);
    }
  }

  return NextResponse.json({ ok: true, enviados, erros });
}
