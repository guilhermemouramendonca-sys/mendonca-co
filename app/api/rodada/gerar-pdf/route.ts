import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement, type JSXElementConstructor } from "react";
type PDFElement = ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;
import { createClient } from "@/lib/supabase/server";
import { RodadaQ12PDF, RodadaGPTWPDF } from "@/lib/pdf/rodada-pdf";

export async function POST(req: NextRequest) {
  const { rodadaId } = await req.json();
  const supabase = await createClient();

  const { data: rodada } = await supabase
    .from("rodadas")
    .select("*")
    .eq("id", rodadaId)
    .single();

  if (!rodada?.resultado_consolidado) {
    return NextResponse.json({ error: "Consolide a rodada antes de gerar o PDF" }, { status: 400 });
  }

  const { data: pesquisas } = await supabase
    .from("pesquisas")
    .select("respondente_nome, respondente_cargo")
    .eq("rodada_id", rodadaId)
    .not("resultado", "is", null);

  const respondentes = (pesquisas ?? []).map((p) =>
    [p.respondente_nome, p.respondente_cargo].filter(Boolean).join(" · ")
  );

  const data = new Date().toLocaleDateString("pt-BR");
  const consolidado = rodada.resultado_consolidado;

  let pdfBuffer: Buffer;

  if (rodada.tipo === "q12") {
    pdfBuffer = Buffer.from(
      await renderToBuffer(
        createElement(RodadaQ12PDF, {
          nome: rodada.nome,
          empresa: rodada.empresa ?? null,
          consolidado,
          respondentes,
          data,
        }) as unknown as PDFElement
      )
    );
  } else if (rodada.tipo === "gptw") {
    pdfBuffer = Buffer.from(
      await renderToBuffer(
        createElement(RodadaGPTWPDF, {
          nome: rodada.nome,
          empresa: rodada.empresa ?? null,
          consolidado,
          respondentes,
          data,
        }) as unknown as PDFElement
      )
    );
  } else {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const path = `rodadas/${rodadaId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("arquivos")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(path);
  const pdfUrl = urlData.publicUrl;

  await supabase.from("rodadas").update({ pdf_url: pdfUrl }).eq("id", rodadaId);

  await fetch(`${req.nextUrl.origin}/api/plano-acao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: `rodada_${rodada.tipo}`,
      referenciaId: rodadaId,
      nome: rodada.nome,
      email: null,
      empresa: rodada.empresa ?? null,
      resultado: rodada.resultado_consolidado,
    }),
  }).catch(() => {});

  return NextResponse.json({ pdfUrl });
}
