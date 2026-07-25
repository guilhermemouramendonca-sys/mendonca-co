import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notificarNovoLead } from "@/lib/email/notificar-lead";

export async function POST(req: NextRequest) {
  try {
    const { nome, email, empresa, cargo, faturamento, score, whatsapp, instagram, utm_source, utm_medium, utm_campaign, utm_content } = await req.json() as {
      nome: string; email: string; empresa?: string; cargo?: string;
      faturamento?: string; score?: number;
      whatsapp?: string; instagram?: string;
      utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string;
    };

    if (!email) return NextResponse.json({ ok: false });

    const supabase = createServiceClient();

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (cliente) return NextResponse.json({ ok: true, tipo: "cliente_existente" });

    const { data: leadExistente } = await supabase
      .from("leads")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (leadExistente) return NextResponse.json({ ok: true, tipo: "lead_existente" });

    const fatLabels: Record<string, string> = {
      ate_7m: "Até R$7M", "7m_30m": "R$7M-R$30M",
      "30m_100m": "R$30M-R$100M", acima_100m: ">R$100M",
    };

    const observacoes = [
      score !== undefined ? `Score geral: ${score.toFixed(1)}/10` : null,
      faturamento ? `Faturamento: ${fatLabels[faturamento] ?? faturamento}` : null,
    ].filter(Boolean).join(" | ");

    await supabase.from("leads").insert({
      nome,
      email,
      empresa: empresa || null,
      cargo: cargo || null,
      tipo_servico: "diagnostico_3d",
      etapa: "novo",
      origem: "diagnostico_publico",
      canal: utm_source || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      observacoes: observacoes || null,
      whatsapp: whatsapp || null,
      instagram: instagram || null,
    });

    notificarNovoLead({
      nome, email, empresa, cargo, whatsapp, instagram,
      origem: "diagnostico_publico",
      observacoes: observacoes || null,
    }).catch(() => {});

    return NextResponse.json({ ok: true, tipo: "lead_criado" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false });
  }
}
