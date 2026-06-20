import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement, type JSXElementConstructor } from "react";
type PDFElement = ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;
import { createClient } from "@/lib/supabase/server";
import { DISCPDF } from "@/lib/pdf/disc-pdf";
import { Q12PDF } from "@/lib/pdf/q12-pdf";
import { GPTWPDF } from "@/lib/pdf/gptw-pdf";
import { enviarEmailPDF } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const { pesquisaId } = await req.json();
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("pesquisas")
    .select("*")
    .eq("id", pesquisaId)
    .single();

  if (!p || !p.resultado) {
    return NextResponse.json({ error: "Pesquisa não encontrada ou sem resultado" }, { status: 404 });
  }

  const nome = p.respondente_nome ?? "Participante";
  const data = new Date(p.concluido_em ?? p.criado_em).toLocaleDateString("pt-BR");
  const empresa = p.respondente_empresa ?? null;
  const cargo = p.respondente_cargo ?? null;
  const tipo: string = p.tipo;

  let pdfBuffer: Buffer;

  if (tipo === "disc") {
    pdfBuffer = Buffer.from(
      await renderToBuffer(createElement(DISCPDF, { nome, empresa, cargo, resultado: p.resultado, data }) as unknown as PDFElement)
    );
  } else if (tipo === "q12") {
    pdfBuffer = Buffer.from(
      await renderToBuffer(createElement(Q12PDF, { nome, empresa, cargo, resultado: p.resultado, data }) as unknown as PDFElement)
    );
  } else if (tipo === "gptw") {
    pdfBuffer = Buffer.from(
      await renderToBuffer(createElement(GPTWPDF, { nome, empresa, cargo, resultado: p.resultado, data }) as unknown as PDFElement)
    );
  } else {
    return NextResponse.json({ error: "Tipo de pesquisa inválido" }, { status: 400 });
  }

  const path = `pesquisas/${tipo}/${pesquisaId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("arquivos")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(path);
  const pdfUrl = urlData.publicUrl;

  await supabase.from("pesquisas").update({ pdf_url: pdfUrl }).eq("id", pesquisaId);

  if (p.respondente_email) {
    await enviarEmailPDF({
      nome: p.respondente_nome ?? "Respondente",
      email: p.respondente_email,
      tipo: tipo as "disc" | "q12" | "gptw",
      pdfUrl,
    });
  }

  await fetch(`${req.nextUrl.origin}/api/plano-acao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo,
      referenciaId: pesquisaId,
      nome: p.respondente_nome,
      email: p.respondente_email,
      empresa: p.respondente_empresa,
      resultado: p.resultado,
    }),
  }).catch(() => {});

  if (p.respondente_email) {
    fetch(`${req.nextUrl.origin}/api/followup/agendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo,
        referenciaId: pesquisaId,
        nome: p.respondente_nome,
        email: p.respondente_email,
        empresa: p.respondente_empresa,
        pdfUrl,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ pdfUrl });
}
