import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { nome, email, empresa, cargo, tipo, observacoes } = await req.json();
  const supabase = await createClient();

  // 1. cliente existente?
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("email_responsavel", email)
    .maybeSingle();

  if (cliente) return NextResponse.json({ status: "cliente_existente" });

  // 2. lead existente?
  const { data: leadExistente } = await supabase
    .from("leads")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (leadExistente) return NextResponse.json({ status: "lead_existente" });

  // 3. criar lead
  const tipoServico: Record<string, string> = {
    disc: "disc",
    q12: "q12",
    gptw: "gptw",
  };

  await supabase.from("leads").insert({
    nome,
    email,
    empresa: empresa || null,
    cargo: cargo || null,
    tipo_servico: tipoServico[tipo] ?? tipo,
    origem: "pesquisa_publica",
    estagio: "novo",
    observacoes: observacoes || null,
  });

  return NextResponse.json({ status: "lead_criado" });
}
