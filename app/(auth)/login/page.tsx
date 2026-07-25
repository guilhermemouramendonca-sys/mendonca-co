"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modo, setModo] = useState<"login" | "recuperar">("login");
  const [enviado, setEnviado] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);
    if (error) {
      setErro("Erro ao enviar e-mail. Verifique o endereço.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-bold text-gold">Mendonça & Co</h1>
          <p className="text-gold/60 mt-2 text-sm">Sistema de Gestão</p>
        </div>

        <div className="bg-surface rounded-card p-8 shadow-lg">
          {modo === "login" ? (
            <>
              <h2 className="font-display text-2xl font-semibold text-text-main mb-6">Entrar</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => { setModo("recuperar"); setErro(""); }}
                      className="text-xs text-gold/70 hover:text-gold underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {erro && <p className="text-sm text-danger">{erro}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold text-text-main mb-2">Recuperar senha</h2>
              <p className="text-sm text-text-muted mb-6">
                Informe seu e-mail e enviaremos um link para redefinir a senha.
              </p>

              {enviado ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-success">
                    E-mail enviado! Verifique sua caixa de entrada e clique no link.
                  </p>
                  <button
                    onClick={() => { setModo("login"); setEnviado(false); }}
                    className="text-xs text-gold/70 hover:text-gold underline"
                  >
                    Voltar para o login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecuperar} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-rec">E-mail</Label>
                    <Input
                      id="email-rec"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {erro && <p className="text-sm text-danger">{erro}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar link"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setModo("login"); setErro(""); }}
                    className="w-full text-xs text-gold/70 hover:text-gold underline text-center"
                  >
                    Voltar para o login
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
