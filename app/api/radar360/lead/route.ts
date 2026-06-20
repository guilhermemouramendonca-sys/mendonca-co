import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ResultadoRadar360 } from "@/lib/radar360/dimensoes";
import { DIMENSOES } from "@/lib/radar360/dimensoes";

export async function POST(req: NextRequest) {
  try {
    const { nome, email, empresa, cargo, faturamento, resultado, utm_source, utm_medium, utm_campaign, utm_content } = await req.json() as {
      nome: string; email: string; empresa?: string; cargo?: string;
      faturamento?: string; resultado: ResultadoRadar360;
      utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string;
    };

    if (!email) return NextResponse.json({ ok: false });

    const supabase = createServiceClient();

    // Verificar se já é cliente
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (cliente) return NextResponse.json({ ok: true, tipo: "cliente_existente" });

    // Verificar se já está no CRM
    const { data: leadExistente } = await supabase
      .from("leads")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (leadExistente) return NextResponse.json({ ok: true, tipo: "lead_existente" });

    // Montar resumo das dimensões para observações
    const resumo = DIMENSOES
      .map((d) => `${d.titulo}: ${resultado.scores[d.id]}/5`)
      .join(" | ");

    const fatLabels: Record<string, string> = {
      ate_7m: "Até R$7M", "7m_30m": "R$7M-R$30M",
      "30m_100m": "R$30M-R$100M", acima_100m: ">R$100M",
    };

    // Criar lead
    await supabase.from("leads").insert({
      nome,
      email,
      empresa: empresa || null,
      cargo: cargo || null,
      tipo_servico: "radar_360",
      etapa: "novo",
      origem: "radar_publico",
      canal: utm_source || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      observacoes: `Radar 360 — Score geral: ${resultado.geral.toFixed(1)}/5 | Porta: ${resultado.portaEntrada}${faturamento ? ` | Fat: ${fatLabels[faturamento] ?? faturamento}` : ""}\n${resumo}`,
    });

    return NextResponse.json({ ok: true, tipo: "lead_criado" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false });
  }
}
