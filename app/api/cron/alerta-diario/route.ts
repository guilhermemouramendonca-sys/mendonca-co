import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const DEST   = "guilherme.moura.mendonca@gmail.com";

// Chamado diariamente às 8h Brasília (11h UTC) pelo Vercel Cron
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const hoje     = new Date().toISOString().split("T")[0];

  // ── 1. Descobrir coluna "concluído" do kanban ──────────────────────
  const { data: colunas } = await supabase
    .from("kanban_colunas")
    .select("id, nome");

  const colunaConcluido = colunas?.find((c) =>
    c.nome?.toLowerCase().includes("conclu")
  )?.id ?? null;

  // ── 2. Tarefas atrasadas ──────────────────────────────────────────
  let queryAtrasadas = supabase
    .from("tarefas")
    .select("id, titulo, prioridade, data_prazo, clientes(nome)")
    .lt("data_prazo", hoje)
    .order("data_prazo", { ascending: true });

  if (colunaConcluido) queryAtrasadas = queryAtrasadas.neq("status", colunaConcluido);

  const { data: tarefasAtrasadas } = await queryAtrasadas;

  // ── 3. Tarefas de hoje ────────────────────────────────────────────
  let queryHoje = supabase
    .from("tarefas")
    .select("id, titulo, prioridade, data_prazo, clientes(nome)")
    .eq("data_prazo", hoje)
    .order("prioridade", { ascending: false });

  if (colunaConcluido) queryHoje = queryHoje.neq("status", colunaConcluido);

  const { data: tarefasHoje } = await queryHoje;

  // ── 4. Follow-ups de leads para hoje ─────────────────────────────
  const { data: followups } = await supabase
    .from("leads")
    .select("id, nome, empresa, proxima_acao, whatsapp, etapa")
    .eq("data_proxima_acao", hoje)
    .not("etapa", "in", '("ganho","perdido")')
    .order("nome");

  // ── 5. Verificar se há algo para reportar ────────────────────────
  const totalItens =
    (tarefasAtrasadas?.length ?? 0) +
    (tarefasHoje?.length ?? 0) +
    (followups?.length ?? 0);

  if (totalItens === 0) {
    return NextResponse.json({ ok: true, enviado: false, motivo: "nada pendente" });
  }

  // ── 6. Montar HTML do e-mail ──────────────────────────────────────
  const dataFormatada = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const prioridadeCor: Record<string, string> = {
    alta:  "#C0392B",
    media: "#C9A84C",
    baixa: "#6B6B6B",
  };

  const etapaLabel: Record<string, string> = {
    novo: "Novo", contato: "Contato", diagnostico: "Diagnóstico",
    proposta: "Proposta", negociacao: "Negociação",
  };

  function secaoTarefas(tarefas: typeof tarefasAtrasadas, titulo: string, cor: string): string {
    if (!tarefas || tarefas.length === 0) return "";
    return `
      <h2 style="color:${cor};font-size:14px;font-weight:700;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.05em">${titulo} (${tarefas.length})</h2>
      <table style="width:100%;border-collapse:collapse">
        ${tarefas.map((t) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clienteNome = (t.clientes as any)?.nome ?? null;
          const diasAtraso  = t.data_prazo
            ? Math.ceil((Date.now() - new Date(t.data_prazo + "T00:00:00").getTime()) / 86400000)
            : 0;
          const pCor = prioridadeCor[t.prioridade] ?? "#6B6B6B";
          return `
            <tr style="border-bottom:1px solid #f0e8d0">
              <td style="padding:8px 0">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pCor};margin-right:8px;vertical-align:middle"></span>
                <strong style="color:#1a1a1a;font-size:14px">${t.titulo}</strong>
                ${clienteNome ? `<span style="color:#888;font-size:12px"> · ${clienteNome}</span>` : ""}
                ${diasAtraso > 0 ? `<span style="color:${cor};font-size:11px;margin-left:8px">${diasAtraso}d de atraso</span>` : ""}
              </td>
            </tr>`;
        }).join("")}
      </table>`;
  }

  function secaoFollowups(leads: typeof followups): string {
    if (!leads || leads.length === 0) return "";
    return `
      <h2 style="color:#2980B9;font-size:14px;font-weight:700;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.05em">Follow-ups comerciais — hoje (${leads.length})</h2>
      <table style="width:100%;border-collapse:collapse">
        ${leads.map((l) => {
          const wa = l.whatsapp
            ? `<a href="https://wa.me/55${l.whatsapp.replace(/\D/g, "")}" style="color:#25D366;font-size:11px;text-decoration:none">📱 WhatsApp</a>`
            : "";
          return `
            <tr style="border-bottom:1px solid #f0e8d0">
              <td style="padding:8px 0">
                <strong style="color:#1a1a1a;font-size:14px">${l.nome}</strong>
                ${l.empresa ? `<span style="color:#888;font-size:12px"> · ${l.empresa}</span>` : ""}
                <span style="color:#2980B9;font-size:11px;margin-left:8px">${etapaLabel[l.etapa] ?? l.etapa}</span>
                ${l.proxima_acao ? `<br><span style="color:#555;font-size:12px;padding-left:16px">→ ${l.proxima_acao}</span>` : ""}
                ${wa ? `<span style="margin-left:12px">${wa}</span>` : ""}
              </td>
            </tr>`;
        }).join("")}
      </table>`;
  }

  const resumo = [
    tarefasAtrasadas?.length ? `<span style="color:#C0392B;font-weight:700">${tarefasAtrasadas.length} tarefa${tarefasAtrasadas.length > 1 ? "s" : ""} atrasada${tarefasAtrasadas.length > 1 ? "s" : ""}</span>` : null,
    tarefasHoje?.length ? `<span style="color:#C9A84C;font-weight:700">${tarefasHoje.length} para hoje</span>` : null,
    followups?.length ? `<span style="color:#2980B9;font-weight:700">${followups.length} follow-up${followups.length > 1 ? "s" : ""} comercia${followups.length > 1 ? "is" : "l"}</span>` : null,
  ].filter(Boolean).join(" · ");

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0D2B2E;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="color:#C9A84C;margin:0;font-size:20px">Mendonça &amp; Co</h1>
        <p style="color:#C9A84C;opacity:0.7;margin:6px 0 0;font-size:13px">Agenda do dia — ${dataFormatada}</p>
      </div>
      <div style="background:#fff;padding:28px 32px;border-radius:0 0 8px 8px;border:1px solid #e8d5a3;border-top:none;color:#1a1a1a">

        <p style="font-size:14px;color:#555;margin:0 0 4px">Bom dia, Guiga! Aqui está o resumo de hoje:</p>
        <p style="font-size:15px;margin:0 0 24px">${resumo}</p>

        ${secaoTarefas(tarefasAtrasadas ?? [], "Tarefas atrasadas", "#C0392B")}
        ${secaoTarefas(tarefasHoje ?? [], "Tarefas de hoje", "#C9A84C")}
        ${secaoFollowups(followups ?? [])}

        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e8d5a3;text-align:center">
          <a href="https://mendonca-co-b31a.vercel.app/tarefas"
            style="display:inline-block;background:#0D2B2E;color:#C9A84C;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;margin-right:8px">
            Ver Tarefas
          </a>
          <a href="https://mendonca-co-b31a.vercel.app/leads"
            style="display:inline-block;background:#0D2B2E;color:#C9A84C;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600">
            Ver Pipeline
          </a>
        </div>
      </div>
    </div>`;

  // ── 7. Enviar ─────────────────────────────────────────────────────
  const qtdAtrasadas = tarefasAtrasadas?.length ?? 0;
  const assunto = qtdAtrasadas > 0
    ? `⚠️ ${qtdAtrasadas} atrasada${qtdAtrasadas > 1 ? "s" : ""} · Agenda ${dataFormatada}`
    : `📋 Agenda do dia — ${dataFormatada}`;

  const { error } = await resend.emails.send({
    from: "Mendonça & Co <onboarding@resend.dev>",
    to: DEST,
    subject: assunto,
    html,
  });

  if (error) {
    console.error("alerta-diario:", error);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    enviado: true,
    tarefasAtrasadas: tarefasAtrasadas?.length ?? 0,
    tarefasHoje: tarefasHoje?.length ?? 0,
    followups: followups?.length ?? 0,
  });
}
