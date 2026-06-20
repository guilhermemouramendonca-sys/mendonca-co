import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { DiagnosticoPDF } from "@/lib/pdf/diagnostico-pdf";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { enviarEmailPDF } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  try {
    const { diagnosticoId } = await req.json();
    if (!diagnosticoId) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const supabase = createServiceClient();

    const { data: diag, error } = await supabase
      .from("diagnosticos")
      .select("*")
      .eq("id", diagnosticoId)
      .single();

    if (error || !diag) return NextResponse.json({ error: "Diagnóstico não encontrado" }, { status: 404 });

    const buffer = await renderToBuffer(
      // @ts-expect-error react-pdf types diverge from React's createElement
      createElement(DiagnosticoPDF, {
        nome: diag.respondente_nome ?? "Respondente",
        empresa: diag.respondente_empresa ?? null,
        cargo: diag.respondente_cargo ?? null,
        faturamento: diag.faturamento_faixa ?? null,
        resultado: diag.resultado,
        data: formatDate(diag.criado_em),
      })
    );

    const fileName = `diagnosticos/${diagnosticoId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("arquivos")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Erro ao salvar PDF" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(fileName);
    const pdfUrl = urlData.publicUrl;

    await supabase.from("diagnosticos").update({ pdf_url: pdfUrl }).eq("id", diagnosticoId);

    if (diag.respondente_email) {
      await enviarEmailPDF({
        nome: diag.respondente_nome ?? "Respondente",
        email: diag.respondente_email,
        tipo: "diagnostico_3d",
        pdfUrl,
      });
    }

    // Plano de ação automático
    await fetch(`${req.nextUrl.origin}/api/plano-acao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "diagnostico_3d",
        referenciaId: diagnosticoId,
        nome: diag.respondente_nome,
        email: diag.respondente_email,
        empresa: diag.respondente_empresa,
        resultado: diag.resultado,
      }),
    }).catch(() => {});

    if (diag.respondente_email) {
      fetch(`${req.nextUrl.origin}/api/followup/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "diagnostico_3d",
          referenciaId: diagnosticoId,
          nome: diag.respondente_nome,
          email: diag.respondente_email,
          empresa: diag.respondente_empresa,
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
