import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Radar360PDF } from "@/lib/pdf/radar360-pdf";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { enviarEmailPDF } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  try {
    const { radar360Id } = await req.json();
    if (!radar360Id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const supabase = createServiceClient();

    const { data: r, error } = await supabase
      .from("radar360")
      .select("*")
      .eq("id", radar360Id)
      .single();

    if (error || !r) return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });

    const buffer = await renderToBuffer(
      // @ts-expect-error react-pdf types diverge from React's createElement
      createElement(Radar360PDF, {
        nome: r.respondente_nome ?? "Respondente",
        empresa: r.respondente_empresa ?? null,
        cargo: r.respondente_cargo ?? null,
        faturamento: r.faturamento_faixa ?? null,
        resultado: r.resultado,
        data: formatDate(r.criado_em),
      })
    );

    const fileName = `radar360/${radar360Id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("arquivos")
      .upload(fileName, buffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) return NextResponse.json({ error: "Erro ao salvar PDF" }, { status: 500 });

    const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(fileName);
    const pdfUrl = urlData.publicUrl;

    await supabase.from("radar360").update({ pdf_url: pdfUrl }).eq("id", radar360Id);

    if (r.respondente_email) {
      await enviarEmailPDF({
        nome: r.respondente_nome ?? "Respondente",
        email: r.respondente_email,
        tipo: "radar_360",
        pdfUrl,
      });
    }

    await fetch(`${req.nextUrl.origin}/api/plano-acao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "radar_360",
        referenciaId: radar360Id,
        nome: r.respondente_nome,
        email: r.respondente_email,
        empresa: r.respondente_empresa,
        resultado: r.resultado,
      }),
    }).catch(() => {});

    if (r.respondente_email) {
      fetch(`${req.nextUrl.origin}/api/followup/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "radar_360",
          referenciaId: radar360Id,
          nome: r.respondente_nome,
          email: r.respondente_email,
          empresa: r.respondente_empresa,
          pdfUrl,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ pdfUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
