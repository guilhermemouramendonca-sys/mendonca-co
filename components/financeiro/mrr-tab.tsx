"use client";

import { formatCurrency } from "@/lib/utils";
import type { Contrato } from "./contratos-tab";
import type { Cobranca } from "./cobrancas-tab";

function mesesAnteriores(n: number): { key: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (n - 1 - i));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    };
  });
}

export default function MRRTab({ contratos, cobrancas }: { contratos: Contrato[]; cobrancas: Cobranca[] }) {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  const hoje_str = hoje.toISOString().split("T")[0];

  // ── KPIs base ──────────────────────────────────────────────
  const retainersAtivos = contratos.filter((c) => c.tipo === "retainer" && c.status === "ativo");
  const mrr = retainersAtivos.reduce((s, c) => s + (c.valor_mensal ?? 0), 0);
  const arr = mrr * 12;
  const clientesAtivos = new Set(retainersAtivos.map((c) => c.cliente_id)).size;
  const ticketMedio = clientesAtivos > 0 ? mrr / clientesAtivos : 0;

  // ── Receita recebida no mês ────────────────────────────────
  const recebidoMes = cobrancas
    .filter((c) => c.status === "pago" && c.data_pagamento?.startsWith(mesAtual))
    .reduce((s, c) => s + c.valor, 0);

  // ── Inadimplência ─────────────────────────────────────────
  const totalPendente = cobrancas.filter((c) => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalAtrasado = cobrancas
    .filter((c) => c.status === "pendente" && (c.vencimento ?? "") < hoje_str)
    .reduce((s, c) => s + c.valor, 0);
  const taxaInadimplencia =
    totalPendente + totalAtrasado > 0
      ? Math.round((totalAtrasado / (totalPendente + totalAtrasado)) * 100)
      : 0;

  // ── Histórico 6 meses (recebimentos reais) ─────────────────
  const meses6 = mesesAnteriores(6);
  const historico = meses6.map(({ key, label }) => {
    const recebido = cobrancas
      .filter((c) => c.status === "pago" && (c.data_pagamento ?? "").startsWith(key))
      .reduce((s, c) => s + c.valor, 0);
    return { label, recebido, isMesAtual: key === mesAtual };
  });
  const maxHistorico = Math.max(...historico.map((h) => h.recebido), mrr, 1);

  // ── MRR por cliente ────────────────────────────────────────
  const mrrPorCliente = retainersAtivos.reduce<Record<string, { nome: string; valor: number }>>((acc, c) => {
    if (!acc[c.cliente_id]) acc[c.cliente_id] = { nome: c.cliente_nome ?? "Cliente", valor: 0 };
    acc[c.cliente_id].valor += c.valor_mensal ?? 0;
    return acc;
  }, {});
  const mrrOrdenado = Object.values(mrrPorCliente).sort((a, b) => b.valor - a.valor);

  // ── Próximas cobranças (30d) e contratos vencendo (60d) ───
  const em30_str = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const em60_str = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];

  const proximasCobrancas = cobrancas
    .filter((c) => c.status === "pendente" && (c.vencimento ?? "") >= hoje_str && (c.vencimento ?? "") <= em30_str)
    .sort((a, b) => (a.vencimento ?? "").localeCompare(b.vencimento ?? ""));

  const contratosVencendo = contratos.filter(
    (c) => c.status === "ativo" && c.data_fim && c.data_fim >= hoje_str && c.data_fim <= em60_str
  );

  const totalProximas = proximasCobrancas.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="space-y-8">
      {/* ── KPIs principais ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary rounded-card p-5 col-span-2 md:col-span-1">
          <p className="text-gold/60 text-xs uppercase tracking-wide mb-1">MRR</p>
          <p className="font-mono-data text-3xl font-bold text-gold">{formatCurrency(mrr)}</p>
          <p className="text-gold/50 text-xs mt-1">receita mensal recorrente</p>
        </div>
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">ARR</p>
          <p className="font-mono-data text-2xl font-bold text-text-main">{formatCurrency(arr)}</p>
          <p className="text-text-muted text-xs mt-1">projeção anual</p>
        </div>
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Ticket médio</p>
          <p className="font-mono-data text-2xl font-bold text-text-main">{formatCurrency(ticketMedio)}</p>
          <p className="text-text-muted text-xs mt-1">{clientesAtivos} cliente{clientesAtivos !== 1 ? "s" : ""} ativo{clientesAtivos !== 1 ? "s" : ""}</p>
        </div>
        <div className={`rounded-card border p-5 ${taxaInadimplencia > 20 ? "bg-red-50 border-red-200" : taxaInadimplencia > 5 ? "bg-yellow-50 border-yellow-200" : "bg-surface border-[#E8D5A3]/50"}`}>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Inadimplência</p>
          <p className={`font-mono-data text-2xl font-bold ${taxaInadimplencia > 20 ? "text-red-600" : taxaInadimplencia > 5 ? "text-yellow-600" : "text-green-600"}`}>
            {taxaInadimplencia}%
          </p>
          <p className="text-text-muted text-xs mt-1">{formatCurrency(totalAtrasado)} em atraso</p>
        </div>
      </div>

      {/* ── Linha 2: histórico + caixa do mês ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Histórico 6 meses */}
        <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
          <h3 className="font-display text-base font-semibold text-text-main mb-5">Recebimentos — últimos 6 meses</h3>
          <div className="flex items-end gap-2 h-36">
            {historico.map((h) => {
              const pct = maxHistorico > 0 ? (h.recebido / maxHistorico) * 100 : 0;
              return (
                <div key={h.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono text-text-muted leading-none">
                    {h.recebido > 0 ? formatCurrency(h.recebido).replace("R$ ", "") : "—"}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: pct > 0 ? `${Math.max(pct, 4)}%` : "2px",
                        backgroundColor: h.isMesAtual ? "#C9A84C" : h.recebido > 0 ? "#C9A84C60" : "#E8D5A3",
                        minHeight: "2px",
                      }}
                    />
                  </div>
                  <span className={`text-[9px] ${h.isMesAtual ? "text-gold font-semibold" : "text-text-muted"}`}>
                    {h.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* MRR linha de referência */}
          {mrr > 0 && (
            <p className="text-xs text-text-muted mt-3 border-t border-dashed border-[#E8D5A3] pt-2">
              Linha MRR: <span className="font-semibold text-gold">{formatCurrency(mrr)}/mês</span>
            </p>
          )}
        </div>

        {/* Caixa atual + próximas */}
        <div className="space-y-4">
          <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
            <h3 className="font-display text-base font-semibold text-text-main mb-3">Caixa do mês</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Recebido</p>
                <p className="font-mono-data text-lg font-bold text-green-600">{formatCurrency(recebidoMes)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">A vencer (30d)</p>
                <p className="font-mono-data text-lg font-bold text-yellow-600">{formatCurrency(totalProximas)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Em atraso</p>
                <p className={`font-mono-data text-lg font-bold ${totalAtrasado > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(totalAtrasado)}
                </p>
              </div>
            </div>
          </div>

          {/* MRR por cliente */}
          <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5 flex-1">
            <h3 className="font-display text-base font-semibold text-text-main mb-3">MRR por cliente</h3>
            {mrrOrdenado.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-4">Nenhum retainer ativo.</p>
            ) : (
              <div className="space-y-2.5">
                {mrrOrdenado.map((c) => {
                  const pct = mrr > 0 ? (c.valor / mrr) * 100 : 0;
                  return (
                    <div key={c.nome}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-text-main truncate flex-1 mr-2">{c.nome}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-text-muted">{Math.round(pct)}%</span>
                          <span className="font-mono-data text-sm font-semibold text-text-main">{formatCurrency(c.valor)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#E8D5A3]/30 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Alertas ──────────────────────────────────────────── */}
      {(contratosVencendo.length > 0 || proximasCobrancas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contratosVencendo.length > 0 && (
            <div className="bg-surface rounded-card border border-yellow-300/50 p-5">
              <h3 className="font-display text-base font-semibold text-text-main mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                Contratos vencendo (60 dias)
              </h3>
              <div className="space-y-2">
                {contratosVencendo.map((c) => {
                  const dias = Math.ceil((new Date(c.data_fim!).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-main">{c.cliente_nome}</p>
                        <p className="text-xs text-text-muted">{c.descricao}</p>
                      </div>
                      <span className="text-xs font-medium text-yellow-600">{dias}d</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {proximasCobrancas.length > 0 && (
            <div className="bg-surface rounded-card border border-[#E8D5A3]/50 p-5">
              <h3 className="font-display text-base font-semibold text-text-main mb-3">
                Próximas cobranças (30 dias) · {formatCurrency(totalProximas)}
              </h3>
              <div className="space-y-2">
                {proximasCobrancas.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-main truncate">{c.cliente_nome}{c.descricao ? ` — ${c.descricao}` : ""}</p>
                      <p className="text-xs text-text-muted">
                        {c.vencimento ? new Date(c.vencimento).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                    <span className="font-mono-data text-sm font-semibold text-text-main ml-4">{formatCurrency(c.valor)}</span>
                  </div>
                ))}
                {proximasCobrancas.length > 6 && (
                  <p className="text-xs text-text-muted">+{proximasCobrancas.length - 6} mais...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {mrr === 0 && cobrancas.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p className="text-sm">
            Cadastre um contrato do tipo <strong>Retainer mensal</strong> para ver o MRR aqui.
          </p>
        </div>
      )}
    </div>
  );
}
