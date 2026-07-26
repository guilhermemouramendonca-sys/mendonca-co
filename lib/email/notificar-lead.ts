import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TITULOS_PDF: Record<string, string> = {
  diagnostico_3d: "Diagnóstico 3D de Liderança",
  radar_360: "Radar 360",
  disc: "Perfil DISC",
  q12: "Pesquisa de Engajamento Q12",
  gptw: "Trust Index GPTW",
  canvas_estrategico: "Canvas Estratégico",
};

export async function notificarPDFGerado({
  nome,
  email,
  empresa,
  tipo,
  pdfUrl,
}: {
  nome: string;
  email: string;
  empresa?: string | null;
  tipo: string;
  pdfUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const titulo = TITULOS_PDF[tipo] ?? tipo;
  await resend.emails.send({
    from: "Mendonça & Co <onboarding@resend.dev>",
    to: "guilherme.moura.mendonca@gmail.com",
    subject: `📄 PDF gerado: ${nome} — ${titulo}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1A2E3A;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#C2A878;margin:0;font-size:20px">Mendonça & Co</h1>
          <p style="color:#E0D0B4;opacity:0.7;margin:4px 0 0;font-size:13px">PDF gerado — ${titulo}</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;border:1px solid #E0D0B4;border-top:none;line-height:1.8;color:#1a1a1a;font-size:14px">
          <p style="margin:0 0 16px"><b>Lead:</b> ${nome}${empresa ? ` · ${empresa}` : ""}</p>
          <p style="margin:0 0 24px"><b>E-mail:</b> ${email}</p>
          <a href="${pdfUrl}" target="_blank"
            style="display:inline-block;background:#C2A878;color:#1A2E3A;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700">
            Ver PDF →
          </a>
          <p style="margin:20px 0 0;font-size:11px;color:#9B9B9B;word-break:break-all">${pdfUrl}</p>
        </div>
      </div>
    `,
  }).catch(() => {});
}

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
        <div style="background:#1A2E3A;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#C2A878;margin:0;font-size:20px">Mendonça &amp; Co</h1>
          <p style="color:#C2A878;opacity:0.7;margin:4px 0 0;font-size:13px">Novo lead via ${origemLabel}</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e0d0b4;border-top:none;line-height:1.8;color:#1a1a1a;font-size:14px">
          ${linhas}
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e0d0b4">
            <p style="margin:0 0 12px;font-size:13px;color:#555">Agende uma conversa de diagnóstico:</p>
            <a href="https://calendar.app.google/ZHeh2G1QZJvtFUYX7"
              style="display:inline-block;background:#1A2E3A;color:#C2A878;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600">
              📅 Agendar Conversa de 30min
            </a>
          </div>
        </div>
      </div>
    `,
  });
}
