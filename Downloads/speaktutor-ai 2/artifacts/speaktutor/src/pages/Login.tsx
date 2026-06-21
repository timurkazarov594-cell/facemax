import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Mic, ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50 blur-3xl" />

      <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary mb-12">
        <Mic className="w-8 h-8" />
        SpeakTutor
      </Link>

      <div className="w-full max-w-md bg-card/50 backdrop-blur border border-border rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">С возвращением</h1>
          <p className="text-muted-foreground">Продолжите своё погружение в английский</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                required
                disabled={isLoading}
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
                placeholder="••••••••"
                className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-medium shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]" disabled={isLoading}>
            {isLoading ? "Входим..." : <>Войти <ArrowRight className="ml-2 w-5 h-5" /></>}
          </Button>
        </form>

        <div className="mt-8 text-center text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
