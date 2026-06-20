import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { nome, email, empresa, cargo, utm_source, utm_medium, utm_campaign, utm_content } = await req.json();
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("email_responsavel", email)
    .maybeSingle();

  if (cliente) return NextResponse.json({ status: "cliente_existente" });

  const { data: leadExistente } = await supabase
    .from("leads")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (leadExistente) return NextResponse.json({ status: "lead_existente" });

  await supabase.from("leads").insert({
    nome,
    email,
    empresa: empresa || null,
    cargo: cargo || null,
    tipo_servico: "canvas_estrategico",
    origem: "canvas_publico",
    etapa: "novo",
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
    utm_content: utm_content || null,
  });

  return NextResponse.json({ status: "lead_criado" });
}
