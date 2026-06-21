import {
  useGetSpeakTutorProfile,
  useListSpeakTutorScenarios,
  useCreateSpeakTutorSession,
  getGetSpeakTutorProfileQueryKey,
  getListSpeakTutorScenariosQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Clock, Loader2, Play, Lock, Zap, Shuffle } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import { useQueryClient } from "@tanstack/react-query";

export default function Practice() {
  const { data: profile, isLoading: profileLoading } = useGetSpeakTutorProfile();
  const { data: scenarios, isLoading: scenariosLoading } = useListSpeakTutorScenarios();
  const createSession = useCreateSpeakTutorSession();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const queryClient = useQueryClient();

  const isPaid = profile?.isPaid ?? false;
  const paidSessionsRemaining = profile?.paidSessionsRemaining ?? 0;
  const needsPurchase = !isPaid || (isPaid && paidSessionsRemaining <= 0);

  const handleStartSession = (scenarioId: string, isLocked?: boolean) => {
    if (isLocked) { setPaywallOpen(true); return; }
    if (needsPurchase && !isPaid) { setPaywallOpen(true); return; }
    if (isPaid && paidSessionsRemaining <= 0) { setPaywallOpen(true); return; }
    createSession.mutate({ data: { scenarioId } }, {
      onSuccess: (session) => setLocation(`/speaktutor/session/${session.id}`),
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { error?: string } } };
        const code = e?.response?.data?.error;
        if (code === "DEMO_COMPLETED" || code === "NO_SESSIONS_REMAINING" || code === "SCENARIO_LOCKED") {
          setPaywallOpen(true);
        }
      },
    });
  };

  const handleRandomSession = () => {
    if (!isPaid) { setPaywallOpen(true); return; }
    if (paidSessionsRemaining <= 0) { setPaywallOpen(true); return; }
    createSession.mutate({ data: { scenarioId: "random" } }, {
      onSuccess: (session) => setLocation(`/speaktutor/session/${session.id}`),
      onError: () => setPaywallOpen(true),
    });
  };

  const handleActivated = () => {
    queryClient.invalidateQueries({ queryKey: getGetSpeakTutorProfileQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListSpeakTutorScenariosQueryKey() });
  };

  const isLoading = profileLoading || scenariosLoading;
  if (isLoading || !scenarios) {
    return (
      <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex items-center gap-3 text-primary">
          <Mic className="w-8 h-8 animate-pulse" />
          <span className="text-xl font-semibold">Загружаем сценарии…</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
      </div>
    );
  }

  const categories = ["all", ...new Set(scenarios.map((s) => s.category))];
  const categoryLabels: Record<string, string> = {
    all: "Все", everyday: "Повседневные", travel: "Путешествия",
    business: "Бизнес", interview: "Собеседование", healthcare: "Здоровье", free: "Свободное общение",
  };
  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-500 border-green-500/20",
    intermediate: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    advanced: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const difficultyLabel: Record<string, string> = {
    beginner: "Начинающий", intermediate: "Средний", advanced: "Продвинутый",
  };

  const filteredScenarios =
    activeCategory === "all" ? scenarios : scenarios.filter((s) => s.category === activeCategory);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      <PaywallModal
        open={paywallOpen}
        variant="purchase"
        onClose={() => setPaywallOpen(false)}
        onActivated={handleActivated}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Практика разговора</h1>
          <p className="text-muted-foreground">
            Выберите ситуацию или нажмите «Случайная».
            {profile && (
              <span className="ml-2 text-primary font-medium">
                Уровень: {levelLabel(profile.level ?? "beginner")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="gap-2 shrink-0 shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]"
            onClick={handleRandomSession}
            disabled={createSession.isPending}
          >
            {createSession.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shuffle className="w-5 h-5" />}
            Случайная ситуация
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {profile && (
        <div className={`mb-6 rounded-2xl border p-4 flex items-center gap-4 ${
          isPaid
            ? paidSessionsRemaining <= 1
              ? "border-orange-500/30 bg-orange-500/5"
              : "border-border/50 bg-card/50"
            : "border-primary/20 bg-primary/5"
        }`}>
          <div className="flex-1">
            {isPaid ? (
              <>
                <p className="text-sm font-semibold mb-1">
                  Доступно сессий: {paidSessionsRemaining}
                </p>
                <p className="text-xs text-muted-foreground">
                  Каждая сессия — 6 сообщений. До 20 с расширением (+7 за 100 ₽).
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold mb-1">Пробный диалог завершён</p>
                <p className="text-xs text-muted-foreground">
                  Пакет из 5 практических сессий — 499 ₽
                </p>
              </>
            )}
          </div>
          {(!isPaid || paidSessionsRemaining <= 1) && (
            <Button
              size="sm" className="gap-1.5 shrink-0"
              onClick={() => setPaywallOpen(true)}
            >
              <Zap className="w-3.5 h-3.5" />
              {isPaid ? "Купить ещё" : "Купить сессии"}
            </Button>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-none">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className={`whitespace-nowrap ${activeCategory === cat ? "shadow-[0_0_15px_-3px_rgba(0,229,255,0.4)]" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {categoryLabels[cat] || cat}
          </Button>
        ))}
      </div>

      {/* Scenarios grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredScenarios.map((scenario, i) => {
          const locked = (scenario as { isPremiumLocked?: boolean }).isPremiumLocked === true;
          return (
            <Card
              key={scenario.id}
              className={`group bg-card/50 backdrop-blur border-border/50 transition-all duration-300 overflow-hidden ${
                locked
                  ? "opacity-60 border-border/30"
                  : "hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(0,229,255,0.2)] hover:-translate-y-1"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg leading-tight">{scenario.title}</CardTitle>
                    <CardDescription className="text-xs">{scenario.titleEn}</CardDescription>
                  </div>
                  {locked && (
                    <div className="shrink-0 ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden sm:block">Платно</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description}</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={difficultyColors[scenario.difficulty] || "bg-muted text-muted-foreground"}>
                    {difficultyLabel[scenario.difficulty] || scenario.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    ~{scenario.durationMinutes} мин
                  </div>
                </div>

                {locked ? (
                  <Button
                    className="w-full gap-2 border-dashed"
                    variant="outline"
                    onClick={() => setPaywallOpen(true)}
                  >
                    <Lock className="w-4 h-4" />
                    Доступно после покупки
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                    variant="secondary"
                    disabled={createSession.isPending}
                    onClick={() => handleStartSession(scenario.id, locked)}
                  >
                    {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Начать
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    beginner: "Начинающий", intermediate: "Средний", advanced: "Продвинутый",
  };
  return map[level] ?? level;
}
