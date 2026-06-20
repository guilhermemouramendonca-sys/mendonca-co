import { NextRequest, NextResponse } from "next/server";
import { recalcularBenchmarks } from "@/lib/benchmarks/calcular";

// Chamado pelo cron quinzenal ou manualmente pelo admin
export async function POST(req: NextRequest) {
  // Proteção simples por secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await recalcularBenchmarks();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Erro ao recalcular benchmarks:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// GET público para o admin disparar manualmente
export async function GET() {
  try {
    const result = await recalcularBenchmarks();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
