import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { RelatorioExecutivoPDF } from "@/lib/pdf/relatorio-executivo-pdf";
import type {
  DiagnosticoData, Radar360Data, PesquisaData, CanvasData,
} from "@/lib/pdf/relatorio-executivo-pdf";

export async function POST(req: NextRequest) {
  const { clienteId } = await req.json();
  const supabase = await createClient();

  // Buscar cliente e contato principal
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nome, empresa")
    .eq("id", clienteId)
    .single();

  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const { data: contatos } = await supabase
    .from("contatos_cliente")
    .select("nome, email, cargo")
    .eq("cliente_id", clienteId)
    .eq("principal", true)
    .limit(1);

  const contatoPrincipal = contatos?.[0];
  const email = contatoPrincipal?.email;

  // Buscar todos os diagnósticos pelo email do contato principal
  const [diagRes, radarRes, pesquisasRes, canvasRes] = await Promise.all([
    email
      ? supabase.from("diagnosticos").select("resultado, criado_em")
          .eq("respondente_email", email).not("resultado", "is", null).order("criado_em")
      : Promise.resolve({ data: [] }),
    email
      ? supabase.from("radar360").select("resultado, criado_em")
          .eq("respondente_email", email).not("resultado", "is", null).order("criado_em")
      : Promise.resolve({ data: [] }),
    email
      ? supabase.from("pesquisas").select("tipo, resultado, criado_em, concluido_em")
          .eq("respondente_email", email).not("resultado", "is", null).order("criado_em")
      : Promise.resolve({ data: [] }),
    email
      ? supabase.from("canvas_estrategico").select("resultado, concluido_em")
          .eq("respondente_email", email).not("resultado", "is", null).order("concluido_em")
      : Promise.resolve({ data: [] }),
  ]);

  const diagnosticos: DiagnosticoData[] = (diagRes.data ?? []).map((d) => ({
    tipo: "diagnostico_3d", resultado: d.resultado, criado_em: d.criado_em,
  }));
  const radar360: Radar360Data[] = (radarRes.data ?? []).map((r) => ({
    tipo: "radar_360", resultado: r.resultado, criado_em: r.criado_em,
  }));
  const pesquisas: PesquisaData[] = (pesquisasRes.data ?? []).map((p) => ({
    tipo: p.tipo as "disc" | "q12" | "gptw", resultado: p.resultado,
    criado_em: p.concluido_em ?? p.criado_em,
  }));
  const canvas: CanvasData[] = (canvasRes.data ?? []).map((cv) => ({
    tipo: "canvas", resultado: cv.resultado, concluido_em: cv.concluido_em,
  }));

  const total = diagnosticos.length + radar360.length + pesquisas.length + canvas.length;
  if (total === 0) {
    return NextResponse.json({ error: "Nenhum diagnóstico encontrado para este cliente." }, { status: 400 });
  }

  const data = new Date().toLocaleDateString("pt-BR");

  const pdfBuffer = Buffer.from(
    await renderToBuffer(
      createElement(RelatorioExecutivoPDF, {
        cliente: {
          nome: contatoPrincipal?.nome ?? cliente.nome,
          empresa: cliente.empresa ?? undefined,
          cargo: contatoPrincipal?.cargo ?? undefined,
        },
        data, diagnosticos, radar360, pesquisas, canvas,
      })
    )
  );

  const path = `relatorios/executivo/${clienteId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("arquivos")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from("arquivos").getPublicUrl(path);
  return NextResponse.json({ pdfUrl: urlData.publicUrl, total });
}
