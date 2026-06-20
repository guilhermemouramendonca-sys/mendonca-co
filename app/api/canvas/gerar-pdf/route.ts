import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement, type JSXElementConstructor } from "react";
import { createClient } from "@/lib/supabase/server";
import { CanvasPDF } from "@/lib/pdf/canvas-pdf";
import { enviarEmailPDF } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const { canvasId } = await req.json();
  const supabase = await createClient();

  const { data: c } = await supabase
    .from("canvas_estrategico")
    .select("*")
    .eq("id", canvasId)
    .single();

  if (!c || !c.resultado) {
    return NextResponse.json({ error: "Canvas não encontrado ou sem resultado" }, { status: 404 });
  }

  const nome = c.respondente_nome ?? "Participante";
  const data = new Date(c.concluido_em ?? c.criado_em).toLocaleDateString("pt-BR");

  const pdfBuffer = Buffer.from(
    await renderToBuffer(
      createElement(CanvasPDF, {
        nome,
        empresa: c.respondente_empresa ?? null,
        cargo: c.respondente_cargo ?? null,
        resultado: c.resultado,
        data,
      }) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    )
  );

  const path = `canvas/${canvasId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("arquivos")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(path);
  const pdfUrl = urlData.publicUrl;

  await supabase.from("canvas_estrategico").update({ pdf_url: pdfUrl }).eq("id", canvasId);

  if (c.respondente_email) {
    await enviarEmailPDF({
      nome: c.respondente_nome ?? "Respondente",
      email: c.respondente_email,
      tipo: "canvas_estrategico",
      pdfUrl,
    });
  }

  await fetch(`${req.nextUrl.origin}/api/plano-acao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "canvas_estrategico",
      referenciaId: canvasId,
      nome: c.respondente_nome,
      email: c.respondente_email,
      empresa: c.respondente_empresa,
      resultado: c.resultado,
    }),
  }).catch(() => {});

  if (c.respondente_email) {
    fetch(`${req.nextUrl.origin}/api/followup/agendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "canvas_estrategico",
        referenciaId: canvasId,
        nome: c.respondente_nome,
        email: c.respondente_email,
        empresa: c.respondente_empresa,
        pdfUrl,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ pdfUrl });
}
