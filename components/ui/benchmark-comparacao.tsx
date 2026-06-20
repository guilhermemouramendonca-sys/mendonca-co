"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type BenchmarkResult = {
  valor: number;
  fonte: "interno" | "referencia";
  total_amostras?: number;
  label: string;
};

interface BenchmarkComparacaoProps {
  tipo: string;
  metrica: string;
  valorAtual: number;
  categoria?: string | null;
  segmento?: string | null;
  porte?: string | null;
  unidade?: string; // "%" ou "/5"
  label?: string;   // "Índice de Engajamento"
}

export function BenchmarkComparacao({
  tipo, metrica, valorAtual,
  categoria, segmento, porte,
  unidade = "%",
}: BenchmarkComparacaoProps) {
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ tipo, metrica });
    if (categoria) params.set("categoria", categoria);
    if (segmento) params.set("segmento", segmento);
    if (porte) params.set("porte", porte);

    fetch(`/api/benchmarks/buscar?${params}`)
      .then((r) => r.json())
      .then((data) => { setBenchmark(data); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, [tipo, metrica, categoria, segmento, porte]);

  if (carregando || !benchmark) return null;

  const diff = valorAtual - benchmark.valor;
  const acima = diff > 0;
  const igual = Math.abs(diff) <= 1;

  const corDiff = igual ? "#6B6B6B" : acima ? "#27AE60" : "#C0392B";
  const Icon = igual ? Minus : acima ? TrendingUp : TrendingDown;
  const textoComparacao = igual
    ? `na média da ${benchmark.label}`
    : acima
    ? `acima da ${benchmark.label}`
    : `abaixo da ${benchmark.label}`;

  return (
    <div className="mt-4 rounded-btn border border-[#E8D5A3]/40 bg-[#F5F0E8] px-4 py-3 flex items-center gap-3">
      <Icon size={16} style={{ color: corDiff, flexShrink: 0 }} />
      <div className="flex-1 text-left">
        <p className="text-xs text-[#6B6B6B] leading-snug">
          <span className="font-semibold" style={{ color: corDiff }}>
            {igual ? "=" : acima ? `+${diff.toFixed(0)}${unidade}` : `${diff.toFixed(0)}${unidade}`}
          </span>{" "}
          {textoComparacao}
        </p>
        <p className="text-[10px] text-[#6B6B6B]/60 mt-0.5">
          Referência: {benchmark.valor}{unidade}
          {benchmark.fonte === "interno" && benchmark.total_amostras
            ? ` · ${benchmark.total_amostras} empresas na nossa base`
            : ` · ${benchmark.fonte === "referencia" ? "dado de mercado público" : ""}`}
        </p>
      </div>
    </div>
  );
}
