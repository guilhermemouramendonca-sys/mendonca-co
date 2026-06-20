import { NextRequest, NextResponse } from "next/server";
import { buscarBenchmark } from "@/lib/benchmarks/calcular";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tipo = searchParams.get("tipo");
  const metrica = searchParams.get("metrica");
  const categoria = searchParams.get("categoria") ?? null;
  const segmento = searchParams.get("segmento") ?? null;
  const porte = searchParams.get("porte") ?? null;

  if (!tipo || !metrica) {
    return NextResponse.json({ error: "tipo e metrica são obrigatórios" }, { status: 400 });
  }

  const resultado = await buscarBenchmark({ tipo, metrica, categoria, segmento, porte });
  return NextResponse.json(resultado ?? null);
}
