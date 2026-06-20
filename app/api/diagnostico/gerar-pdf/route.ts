import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { DiagnosticoPDF } from "@/lib/pdf/diagnostico-pdf";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

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

    return NextResponse.json({ pdfUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
