import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle2, XCircle, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSpeakTutorProfileQueryKey } from "@workspace/api-client-react";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "loading" | "not_found";

function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("speaktutor_jwt") ?? ""}`,
  };
}

export default function PaymentReturn() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const queryClient = useQueryClient();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentDbId = params.get("payment_db_id");

    if (!paymentDbId) {
      setStatus("not_found");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/speaktutor/payment/${paymentDbId}/status`, {
          headers: authHeader(),
        });
        if (!res.ok) { setStatus("failed"); return; }
        const data = await res.json() as { status: PaymentStatus };
        if (data.status === "paid") {
          setStatus("paid");
          queryClient.invalidateQueries({ queryKey: getGetSpeakTutorProfileQueryKey() });
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "failed" || data.status === "refunded") {
          setStatus(data.status);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // keep polling
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    const timeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStatus((s) => (s === "loading" || s === "pending" ? "pending" : s));
    }, 120_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(timeout);
    };
  }, [queryClient]);

  useEffect(() => {
    if (status !== "paid") return;
    const t = setTimeout(() => setLocation("/dashboard"), 4000);
    return () => clearTimeout(t);
  }, [status, setLocation]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 text-primary mb-10">
        <Mic className="w-7 h-7" />
        <span className="text-2xl font-bold tracking-tight">SpeakTutor</span>
      </div>

      <div className="bg-card border border-border rounded-3xl p-10 max-w-md w-full text-center shadow-[0_0_60px_-15px_rgba(0,229,255,0.2)]">
        {status === "loading" || status === "pending" ? (
          <>
            <Loader2 className="w-14 h-14 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold mb-2">Проверяем оплату…</h2>
            <p className="text-muted-foreground text-sm">
              Это займёт несколько секунд. Не закрывайте страницу.
            </p>
          </>
        ) : status === "paid" ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-green-500">Оплата успешно получена.</h2>
            <p className="text-foreground font-medium mb-1">Вам начислено 5 практических сессий.</p>
            <p className="text-muted-foreground text-sm mb-6">Переходим на панель управления…</p>
            <Link href="/dashboard">
              <Button className="w-full gap-2 shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]">
                Перейти сейчас
              </Button>
            </Link>
          </>
        ) : status === "failed" || status === "refunded" ? (
          <>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-destructive">Оплата не прошла</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Платёж был отклонён или отменён. Попробуйте снова.
            </p>
            <Link href="/practice">
              <Button className="w-full">Попробовать снова</Button>
            </Link>
          </>
        ) : (
          <>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Платёж не найден</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Не удалось получить информацию о платеже. Если деньги были списаны, свяжитесь с поддержкой.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">На главную</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
