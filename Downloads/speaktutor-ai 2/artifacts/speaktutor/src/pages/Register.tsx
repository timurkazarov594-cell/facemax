import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mic, ArrowRight, User, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState("beginner");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();

  const levels = [
    { id: "beginner",     title: "Новичок",     desc: "Знаю пару слов" },
    { id: "intermediate", title: "Средний",      desc: "Могу объясниться" },
    { id: "advanced",     title: "Продвинутый", desc: "Свободно говорю" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Необходимо принять условия Оферты для регистрации.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) { setError("Введите email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { setError("Неверный формат email"); return; }
    if (password.length < 6) { setError("Пароль слишком короткий (минимум 6 символов)"); return; }

    setIsLoading(true);
    try {
      await register(trimmedEmail, password, name, level);
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background opacity-50 blur-3xl" />

      <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary mb-12">
        <Mic className="w-8 h-8" />
        SpeakTutor
      </Link>

      <div className="w-full max-w-md bg-card/50 backdrop-blur border border-border rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Начните бесплатно</h1>
          <p className="text-muted-foreground">Создайте аккаунт и начните говорить</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Имя (необязательно)</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Иван"
                className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="ivan@example.com"
                className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Минимум 6 символов"
                className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Уровень английского</Label>
            <div className="grid grid-cols-3 gap-2">
              {levels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`p-3 rounded-xl border text-left text-sm transition-all ${
                    level === l.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background/50 text-muted-foreground hover:border-primary/50"
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs opacity-70 mt-0.5">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Terms acceptance checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={isLoading}
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                termsAccepted
                  ? "bg-primary border-primary"
                  : "bg-background/50 border-border group-hover:border-primary/50"
              }`}>
                {termsAccepted && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-muted-foreground leading-snug">
              Я ознакомился(ась) и принимаю условия{" "}
              <Link href="/offer" className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                Оферты и Пользовательского соглашения
              </Link>
              .
            </span>
          </label>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-medium shadow-[0_0_20px_-5px_rgba(139,92,246,0.4)]"
            disabled={isLoading || !termsAccepted}
          >
            {isLoading ? "Создаём аккаунт..." : <>Создать аккаунт <ArrowRight className="ml-2 w-5 h-5" /></>}
          </Button>
        </form>

        <div className="mt-6 text-center text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
