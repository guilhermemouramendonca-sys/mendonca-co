import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type NotificarLeadParams = {
  nome: string;
  email: string;
  empresa?: string | null;
  cargo?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  origem: string;
  observacoes?: string | null;
};

export async function notificarNovoLead(params: NotificarLeadParams) {
  const { nome, email, empresa, cargo, whatsapp, instagram, origem, observacoes } = params;

  const origemLabels: Record<string, string> = {
    canvas_publico: "Canvas Estratégico",
    radar_publico: "Radar 360",
    pesquisa_publica: "Pesquisa",
    diagnostico_publico: "Diagnóstico 3D",
    manual: "Manual",
  };

  const origemLabel = origemLabels[origem] ?? origem;

  const linhas = [
    `<b>Nome:</b> ${nome}`,
    `<b>E-mail:</b> ${email}`,
    empresa ? `<b>Empresa:</b> ${empresa}` : null,
    cargo ? `<b>Cargo:</b> ${cargo}` : null,
    whatsapp ? `<b>WhatsApp:</b> ${whatsapp}` : null,
    instagram ? `<b>Instagram:</b> ${instagram}` : null,
    observacoes ? `<b>Observações:</b><br>${observacoes.replace(/\n/g, "<br>")}` : null,
  ].filter(Boolean).join("<br>");

  await resend.emails.send({
    from: "Mendonça & Co <onboarding@resend.dev>",
    to: "guilherme.moura.mendonca@gmail.com",
    subject: `Novo lead: ${nome} — ${origemLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0D2B2E;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#C9A84C;margin:0;font-size:20px">Mendonça &amp; Co</h1>
          <p style="color:#C9A84C;opacity:0.7;margin:4px 0 0;font-size:13px">Novo lead via ${origemLabel}</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e8d5a3;border-top:none;line-height:1.8;color:#1a1a1a;font-size:14px">
          ${linhas}
        </div>
      </div>
    `,
  });
}
