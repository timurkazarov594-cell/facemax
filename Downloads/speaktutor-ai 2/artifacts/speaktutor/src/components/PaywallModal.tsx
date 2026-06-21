import { useState } from "react";
import { X, Zap, Lock, CheckCircle2, MessageSquare, ShieldCheck, BookOpen, BarChart2, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type PaywallVariant = "purchase" | "extension";

type Props = {
  open: boolean;
  variant?: PaywallVariant;
  onClose: () => void;
  onActivated?: () => void;
  sessionId?: number;
};

function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("speaktutor_jwt") ?? ""}`,
  };
}

export function PaywallModal({ open, variant = "purchase", onClose, onActivated, sessionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!open) return null;

  const handlePurchase = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/speaktutor/payment/create", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ returnUrl: `${window.location.origin}${import.meta.env.BASE_URL}payment/return` }),
      });
      const data = await res.json() as { confirmationUrl?: string; error?: string };
      if (!res.ok || data.error) {
        setError("Не удалось создать платёж. Попробуйте позже.");
        return;
      }
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      } else {
        setError("Платёжный сервис временно недоступен. Попробуйте позже.");
      }
    } catch {
      setError("Ошибка соединения. Проверьте интернет и повторите.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/speaktutor/sessions/${sessionId}/extend`, {
        method: "POST",
        headers: authHeader(),
      });
      if (!res.ok) { setError("Не удалось продлить сессию."); return; }
      onActivated?.();
      onClose();
    } catch {
      setError("Ошибка соединения.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-[0_0_80px_-20px_rgba(0,229,255,0.25)] relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {variant === "extension" ? (
          <ExtensionContent
            loading={loading}
            error={error}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onPurchase={handleExtend}
            onClose={onClose}
          />
        ) : (
          <PurchaseContent
            loading={loading}
            error={error}
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
            onPurchase={handlePurchase}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function TermsCheckbox({ accepted, onChange }: { accepted: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={accepted} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          accepted ? "bg-primary border-primary" : "bg-background/50 border-border group-hover:border-primary/50"
        }`}>
          {accepted && (
            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground leading-snug">
        Я ознакомился(ась) с{" "}
        <Link href="/offer" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <FileText className="w-3 h-3" />
          Офертой и Пользовательским соглашением
        </Link>{" "}
        и принимаю их условия.
      </span>
    </label>
  );
}

function LegalNotice() {
  return (
    <div className="text-[11px] text-muted-foreground/70 leading-relaxed border-t border-border/50 pt-3 mt-2">
      Пользователь понимает, что результаты изучения английского языка зависят от его личной вовлечённости
      и усилий. SpeakTutor не гарантирует достижение конкретного уровня знаний или 100% результата.
      Пользователь самостоятельно принимает решение об оплате сервиса и несёт ответственность за это решение.
    </div>
  );
}

function PurchaseContent({
  loading, error, termsAccepted, onTermsChange, onPurchase, onClose,
}: { loading: boolean; error: string; termsAccepted: boolean; onTermsChange: (v: boolean) => void; onPurchase: () => void; onClose: () => void }) {
  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Продолжить диалог?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Вы использовали доступные сообщения. Чтобы продолжить обучение, приобретите пакет практических сессий.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-5 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-primary">Пакет из 5 практических сессий</span>
          <span className="text-2xl font-bold text-primary">499 ₽</span>
        </div>

        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Пакет включает:</p>

        <div className="space-y-2">
          {[
            { icon: MessageSquare, text: "5 практических сессий" },
            { icon: MessageSquare, text: "6 сообщений в каждой сессии" },
            { icon: Lock,          text: "10 сценариев разблокированы" },
            { icon: CheckCircle2,  text: "Анализ грамматики" },
            { icon: BookOpen,      text: "Анализ словарного запаса" },
            { icon: Star,          text: "Анализ произношения" },
            { icon: BookOpen,      text: "Автоматическое сохранение новых слов в словарь" },
            { icon: BarChart2,     text: "Достижения и статистика прогресса" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Icon className="w-3.5 h-3.5 text-primary/70 mt-0.5 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 px-1">
        <ShieldCheck className="w-3.5 h-3.5 text-primary/60 shrink-0" />
        Безопасная оплата через ЮKassa
      </div>

      {/* Terms checkbox */}
      <div className="mb-4">
        <TermsCheckbox accepted={termsAccepted} onChange={onTermsChange} />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center mb-3">{error}</p>
      )}

      <div className="space-y-2">
        <Button
          className="w-full gap-2 shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]"
          size="lg"
          disabled={loading || !termsAccepted}
          onClick={onPurchase}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              Перенаправление…
            </span>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Купить 5 сессий за 499 ₽
            </>
          )}
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
          Позже
        </Button>
      </div>

      <LegalNotice />
    </>
  );
}

function ExtensionContent({
  loading, error, termsAccepted, onTermsChange, onPurchase, onClose,
}: { loading: boolean; error: string; termsAccepted: boolean; onTermsChange: (v: boolean) => void; onPurchase: () => void; onClose: () => void }) {
  return (
    <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Продолжить диалог?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Вы использовали все сообщения в этой сессии. Получите ещё 7 сообщений, чтобы продолжить разговор.
        </p>
      </div>

      <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 mb-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Продление текущей сессии</span>
          <span className="font-bold text-2xl text-orange-500">100 ₽</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          +7 сообщений к текущей беседе
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 px-1">
        <ShieldCheck className="w-3.5 h-3.5 text-orange-500/60 shrink-0" />
        Безопасная оплата через ЮKassa
      </div>

      {/* Terms checkbox */}
      <div className="mb-4">
        <TermsCheckbox accepted={termsAccepted} onChange={onTermsChange} />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center mb-3">{error}</p>
      )}

      <div className="space-y-2">
        <Button
          className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)]"
          size="lg"
          disabled={loading || !termsAccepted}
          onClick={onPurchase}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Обработка…
            </span>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Продлить за 100 ₽
            </>
          )}
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
          Завершить сессию
        </Button>
      </div>

      <LegalNotice />
    </>
  );
}
