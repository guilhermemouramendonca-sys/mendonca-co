import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mendonça & Co — Consultoria de Board e Liderança Empresarial",
  description:
    "Ajudamos donos de empresa a construir negócios que crescem com menos dependência deles. Mentoria 3D, Diagnóstico de Liderança e Radar 360.",
};

const SERVICOS = [
  {
    num: "01",
    nome: "Mentoria 3D",
    descricao:
      "Acompanhamento estratégico para donos de negócios que querem crescer com Disciplina, Direção e Domínio — as três dimensões que separam empresas que escalam das que emperram.",
    duracao: "Processo de 6 meses",
  },
  {
    num: "02",
    nome: "Diagnóstico de Liderança",
    descricao:
      "Avaliação profunda das três dimensões com radar visual, Matriz de Maturidade e plano de ação priorizado. Em uma sessão, você sabe exatamente onde está e o que fazer.",
    duracao: "Sessão única + relatório",
  },
  {
    num: "03",
    nome: "Radar 360",
    descricao:
      "Mapeamento das 8 dimensões do negócio — estratégia, financeiro, processos, equipe e mais. Identifica gargalos, prioridades e a porta de entrada para o próximo nível.",
    duracao: "Sessão única + relatório",
  },
  {
    num: "04",
    nome: "Palestra",
    descricao:
      "Apresentações de alto impacto sobre liderança, cultura organizacional e crescimento sustentável para eventos corporativos, convenções e programas de desenvolvimento.",
    duracao: "Personalizado",
  },
];

const FRASES = [
  "Empresa que depende de você não é patrimônio. É refém.",
  "Cultura não é o que está escrito na parede. É o que você tolera quando ninguém está olhando.",
  "Quem executa, soma. Quem forma, multiplica.",
  "Crescer sem estrutura não é escala. É pressão acumulada.",
];

const CALENDAR = "https://calendar.app.google/ZHeh2G1QZJvtFUYX7";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text-main">

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary/96 backdrop-blur-md border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-gold tracking-tight">
            Mendonça & Co
          </span>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#servicos" className="text-sm text-gold/70 hover:text-gold transition-colors">Serviços</a>
            <a href="#sobre"    className="text-sm text-gold/70 hover:text-gold transition-colors">Sobre</a>
            <a href={CALENDAR}  target="_blank" rel="noopener noreferrer"
               className="text-sm text-gold/70 hover:text-gold transition-colors">Agendar conversa</a>
            <Link href="/login"
              className="text-sm font-medium px-4 py-2 rounded-btn border border-gold/40 text-gold hover:bg-gold/10 transition-colors">
              Entrar no Sistema →
            </Link>
          </nav>
          <Link href="/login" className="md:hidden text-sm text-gold border border-gold/40 px-3 py-1.5 rounded-btn">
            Entrar
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="bg-primary min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <p className="text-gold/60 text-sm font-medium tracking-widest uppercase mb-6">
                Consultoria de Board e Liderança Empresarial
              </p>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.05] mb-6">
                Liderança que{" "}
                <span className="text-gold">escala.</span>
                <br />
                Negócios que{" "}
                <span className="text-gold">crescem.</span>
              </h1>
              <p className="text-gold/60 text-base italic mb-8 border-l-2 border-gold/30 pl-4">
                "O maior obstáculo da sua empresa mora no espelho."
              </p>
              <p className="text-gold-light/80 text-lg leading-relaxed mb-10">
                Trabalhamos com donos de empresa para construir negócios que crescem
                com estrutura, liderança e cultura — sem depender só de você.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={CALENDAR}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gold text-primary font-semibold px-8 py-4 rounded-btn hover:bg-gold/90 transition-colors text-sm"
                >
                  Agendar conversa de 30min
                </a>
                <a
                  href="#servicos"
                  className="inline-flex items-center gap-2 border border-gold/30 text-gold px-8 py-4 rounded-btn hover:bg-gold/10 transition-colors text-sm"
                >
                  Ver serviços
                </a>
              </div>
            </div>

            {/* Foto hero */}
            <div className="relative hidden md:block">
              <div className="relative h-[580px] rounded-card overflow-hidden">
                <Image
                  src="/images/guilherme-stage.jpg"
                  alt="Guilherme Mendonça no palco"
                  fill
                  className="object-cover object-center"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-16 border-t border-gold/10 pt-10 grid grid-cols-3 gap-8 max-w-2xl">
            {[
              { num: "3D", label: "Disciplina · Direção · Domínio" },
              { num: "360°", label: "Diagnóstico completo do negócio" },
              { num: "6M", label: "Processo de acompanhamento" },
            ].map((item) => (
              <div key={item.num}>
                <p className="font-display text-3xl font-bold text-gold">{item.num}</p>
                <p className="text-xs text-gold/50 mt-1 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ───────────────────────────────────────── */}
      <section className="py-20 bg-[#0f1e27]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {FRASES.map((frase, i) => (
              <div key={i} className="border-l-2 border-gold/30 pl-6 py-2">
                <p className="font-display text-xl md:text-2xl text-white/90 leading-snug italic">
                  "{frase}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ────────────────────────────────────────── */}
      <section id="servicos" className="py-24 bg-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <p className="text-gold text-sm font-medium tracking-widest uppercase mb-3">O que fazemos</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-text-main">Serviços</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {SERVICOS.map((s) => (
              <div key={s.num}
                className="bg-white border border-[#E0D0B4]/60 rounded-card p-8 hover:border-gold/40 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-5">
                  <span className="font-display text-5xl font-bold text-[#E0D0B4] group-hover:text-gold/30 transition-colors">
                    {s.num}
                  </span>
                  <span className="text-xs font-medium text-text-muted bg-bg px-3 py-1 rounded-full border border-[#E0D0B4]/60">
                    {s.duracao}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-primary mb-3">{s.nome}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{s.descricao}</p>
                <a
                  href={CALENDAR}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-6 text-sm text-gold font-medium hover:gap-3 transition-all"
                >
                  Agendar conversa →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NO PALCO ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative h-[500px] md:h-[600px]">
          <Image
            src="/images/guilherme-palco.jpg"
            alt="Guilherme Mendonça palestrando para grande plateia"
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-primary/65" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-6xl mx-auto px-6 pb-16 w-full">
              <p className="text-gold/60 text-sm font-medium tracking-widest uppercase mb-4">No palco</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
                "No tatame e na empresa, quem reage a tudo perde.
                <br className="hidden md:block" /> Quem escolhe o golpe, vence."
              </h2>
              <p className="text-gold-light/60 text-sm">
                Palestras para eventos corporativos, convenções e programas de liderança.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM ───────────────────────────────────────── */}
      <section className="py-24 bg-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-sm font-medium tracking-widest uppercase mb-3">Para quem é</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-text-main mb-8">
                Feito para donos de empresa que já cresceram — e querem continuar crescendo.
              </h2>
              <p className="text-text-muted leading-relaxed mb-6">
                Se você tem uma empresa com faturamento entre R$ 3M e R$ 100M ao ano,
                já tem um time mas ainda sente que tudo passa por você,
                e quer construir uma operação que cresce com estrutura — é aqui.
              </p>
              <a
                href={CALENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-gold font-semibold px-8 py-4 rounded-btn hover:bg-primary/90 transition-colors text-sm"
              >
                Agendar uma conversa →
              </a>
            </div>
            <div className="space-y-4">
              {[
                "Empresa já validada, mas crescimento emperrou",
                "Time existe mas depende demais do dono",
                "Decisão estratégica ainda centralizada",
                "Cultura não está sendo transmitida para o time",
                "Faturamento cresceu, mas a margem não acompanhou",
                "Quer escalar sem perder qualidade e controle",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-btn border border-[#E0D0B4]/40">
                  <span className="text-gold mt-0.5 shrink-0">✓</span>
                  <span className="text-sm text-text-main">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOBRE ───────────────────────────────────────────── */}
      <section id="sobre" className="py-24 bg-primary">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Foto */}
            <div className="relative">
              <div className="relative h-[520px] rounded-card overflow-hidden">
                <Image
                  src="/images/guilherme-mic.webp"
                  alt="Guilherme Mendonça"
                  fill
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
              </div>
            </div>

            {/* Texto */}
            <div>
              <p className="text-gold/60 text-sm font-medium tracking-widest uppercase mb-6">Sobre</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-8">
                Guilherme Mendonça
              </h2>
              <p className="text-gold-light/80 text-lg leading-relaxed mb-6">
                Consultor especializado em crescimento empresarial e desenvolvimento de liderança.
                Trabalha com donos de empresa para construir negócios mais estruturados,
                equipes mais autônomas e líderes mais completos.
              </p>
              <p className="text-gold-light/60 text-sm leading-relaxed mb-8">
                Com a metodologia 3D — Disciplina, Direção e Domínio — já acompanhou dezenas
                de empresas a destravar o próximo nível de crescimento com clareza estratégica
                e execução consistente.
              </p>
              <p className="font-display text-xl text-gold italic mb-10">
                "Legado é o que continua de pé quando você sai da sala."
              </p>
              <a
                href={CALENDAR}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold text-primary font-semibold px-8 py-4 rounded-btn hover:bg-gold/90 transition-colors text-sm"
              >
                Conversar com o Guilherme →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────── */}
      <section className="py-24 bg-bg">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gold text-sm font-medium tracking-widest uppercase mb-4">Próximo passo</p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-text-main mb-4">
            Pronto para conversar?
          </h2>
          <p className="font-display text-xl text-text-muted italic mb-8">
            "Legado é o que continua de pé quando você sai da sala."
          </p>
          <p className="text-text-muted text-lg mb-10 max-w-lg mx-auto">
            30 minutos. Sem compromisso. Entendemos seu momento e te mostramos se faz sentido avançarmos juntos.
          </p>
          <a
            href={CALENDAR}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-gold font-semibold px-10 py-5 rounded-btn hover:bg-primary/90 transition-colors"
          >
            Agendar conversa de 30min →
          </a>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-primary py-12 border-t border-gold/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg font-bold text-gold">Mendonça & Co</p>
            <p className="text-xs text-gold/40 mt-1">Consultoria de Board e Liderança Empresarial</p>
          </div>
          <div className="flex items-center gap-6">
            <a href={CALENDAR} target="_blank" rel="noopener noreferrer"
               className="text-xs text-gold/50 hover:text-gold transition-colors">
              Agendar conversa
            </a>
            <a href="mailto:guilherme@mendoncaeco.com"
               className="text-xs text-gold/50 hover:text-gold transition-colors">
              guilherme@mendoncaeco.com
            </a>
            <Link href="/login"
              className="text-xs font-medium text-gold border border-gold/30 px-4 py-2 rounded-btn hover:bg-gold/10 transition-colors">
              Área do cliente
            </Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-8 pt-6 border-t border-gold/10">
          <p className="text-xs text-gold/25 text-center">
            © {new Date().getFullYear()} Mendonça & Co. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
