import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { PropostaPDF } from "@/lib/pdf/proposta-pdf";
import React from "react";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const {
    leadId,
    clienteId,
    nomeProspect,
    empresa,
    email,
    servico,
    descricao,
    valor,
    condicaoPagamento,
    validadeDias = 15,
    observacoes,
  } = body;

  if (!nomeProspect || !servico) {
    return NextResponse.json({ error: "nomeProspect e servico são obrigatórios" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Inserir proposta e obter número sequencial
  const { data: proposta, error: errInsert } = await supabase
    .from("propostas")
    .insert({
      lead_id: leadId ?? null,
      cliente_id: clienteId ?? null,
      nome_prospect: nomeProspect,
      empresa: empresa ?? null,
      email: email ?? null,
      servico,
      descricao: descricao ?? null,
      valor: valor ?? null,
      condicao_pagamento: condicaoPagamento ?? null,
      validade_dias: validadeDias,
      observacoes: observacoes ?? null,
      criado_por: user.id,
    })
    .select()
    .single();

  if (errInsert || !proposta) {
    return NextResponse.json({ error: errInsert?.message ?? "Erro ao criar proposta" }, { status: 500 });
  }

  // Gerar PDF
  const propostaData = {
    numero: proposta.numero,
    nomeProspect,
    empresa,
    email,
    servico,
    descricao,
    valor,
    condicaoPagamento,
    validadeDias,
    observacoes,
    dataEmissao: proposta.criado_em,
  };

  const buffer = await renderToBuffer(React.createElement(PropostaPDF, { proposta: propostaData }) as unknown as import("react").ReactElement<import("@react-pdf/renderer").DocumentProps>);

  // Upload para Supabase Storage
  const path = `propostas/${proposta.id}.pdf`;
  const { error: errUpload } = await supabase.storage
    .from("arquivos")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });

  if (errUpload) {
    return NextResponse.json({ error: errUpload.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("arquivos").getPublicUrl(path);

  // Atualizar proposta com pdf_url
  await supabase.from("propostas").update({ pdf_url: publicUrl }).eq("id", proposta.id);

  return NextResponse.json({ propostaId: proposta.id, pdfUrl: publicUrl, numero: proposta.numero });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { id, status } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "id e status são obrigatórios" }, { status: 400 });
  }

  const { error } = await supabase
    .from("propostas")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
