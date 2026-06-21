import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Loader2, Trophy, Star, CheckCircle2, AlertCircle, TrendingUp,
  MessageSquare, Target, Lightbulb, ArrowRight, LayoutDashboard, Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateSpeakTutorSession } from "@workspace/api-client-react";

type SummaryData = {
  id: number;
  scenarioTitle: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  status: string;
  overallScore: number | null;
  grammarScore: number | null;
  vocabularyScore: number | null;
  naturalnessScore: number | null;
  pronunciationScore: number | null;
  totalMistakes: number | null;
  xpEarned: number | null;
  hintsUsedCount: number;
  messageCount: number;
  bestPhrase: string | null;
  weakestPhrase: string | null;
  summaryFeedback: {
    positives?: string[];
    improvements?: string[];
    repeatedMistakes?: string[];
    bestCorrections?: { userSaid: string; betterVersion: string; explanationRu: string }[];
  } | null;
};

export default function SessionSummary() {
  const { id } = useParams();
  const sessionId = Number(id);
  const [, setLocation] = useLocation();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const createSession = useCreateSpeakTutorSession();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/speaktutor/sessions/${sessionId}/summary`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("speaktutor_jwt") ?? ""}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load summary");
        const json = await res.json() as SummaryData;
        setData(json);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) load();
  }, [sessionId]);

  const handleNewSession = () => {
    createSession.mutate({ data: { scenarioId: "random" } }, {
      onSuccess: (session) => setLocation(`/session/${session.id}`),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Собираем итоги сессии…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">Не удалось загрузить итоги сессии.</p>
        <Button onClick={() => setLocation("/dashboard")}>На главную</Button>
      </div>
    );
  }

  const overallPct = data.overallScore != null ? Math.round(data.overallScore * 10) : 0;
  const durationMin = data.durationSeconds ? Math.round(data.durationSeconds / 60) : 0;
  const durationSec = data.durationSeconds ? data.durationSeconds % 60 : 0;

  const scoreColor = (pct: number) =>
    pct >= 80 ? "text-green-500" : pct >= 60 ? "text-orange-500" : "text-destructive";

  const scoreRing = (pct: number) =>
    pct >= 80 ? "stroke-green-500" : pct >= 60 ? "stroke-orange-500" : "stroke-destructive";

  const overallLabel = overallPct >= 85 ? "Отлично!" : overallPct >= 70 ? "Хорошо" : overallPct >= 50 ? "Неплохо" : "Нужно практиковаться";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Итоги сессии</h1>
        <p className="text-muted-foreground">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{data.scenarioTitle}</Badge>
        </p>
      </div>

      {/* Overall score ring + stats */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Ring */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-border/40" />
                <circle
                  cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - overallPct / 100)}`}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${scoreRing(overallPct)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor(overallPct)}`}>{overallPct}</span>
                <span className="text-xs text-muted-foreground">из 100</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 w-full">
              <p className={`text-xl font-semibold mb-4 ${scoreColor(overallPct)}`}>{overallLabel}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCell label="Реплик" value={String(data.messageCount)} icon={<MessageSquare className="w-4 h-4" />} />
                <StatCell label="Ошибок" value={String(data.totalMistakes ?? 0)} icon={<AlertCircle className="w-4 h-4" />} />
                <StatCell label="Подсказок" value={String(data.hintsUsedCount)} icon={<Lightbulb className="w-4 h-4" />} />
                <StatCell label="Время" value={durationMin > 0 ? `${durationMin}м ${durationSec}с` : `${durationSec}с`} icon={<Target className="w-4 h-4" />} />
              </div>
              {data.xpEarned != null && data.xpEarned > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-muted-foreground">Получено XP:</span>
                  <span className="font-bold text-yellow-500">+{data.xpEarned}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score breakdown */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Оценки по категориям</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar label="Грамматика" value={data.grammarScore ?? 0} />
          <ScoreBar label="Лексика" value={data.vocabularyScore ?? 0} />
          <ScoreBar label="Естественность" value={data.naturalnessScore ?? 0} />
          <ScoreBar label="Произношение" value={data.pronunciationScore ?? 0} />
        </CardContent>
      </Card>

      {/* Positives */}
      {data.summaryFeedback?.positives?.length ? (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-green-500"><CheckCircle2 className="w-5 h-5" />Что получилось хорошо</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.summaryFeedback.positives.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Improvements */}
      {data.summaryFeedback?.improvements?.length ? (
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-orange-500"><TrendingUp className="w-5 h-5" />Что нужно улучшить</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.summaryFeedback.improvements.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <ArrowRight className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Repeated mistakes */}
      {data.summaryFeedback?.repeatedMistakes?.length ? (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="w-5 h-5" />Повторяющиеся ошибки</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.summaryFeedback.repeatedMistakes.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-destructive mt-0.5">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* Best corrections */}
      {data.summaryFeedback?.bestCorrections?.length ? (
        <Card className="bg-card/50 border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" />Лучшие исправления</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.summaryFeedback.bestCorrections.map((c, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-2">
                <div className="text-sm text-muted-foreground line-through">{c.userSaid}</div>
                <div className="text-sm font-medium text-green-500 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  {c.betterVersion}
                </div>
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{c.explanationRu}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Best / Weakest phrase */}
      {(data.bestPhrase || data.weakestPhrase) && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader><CardTitle>Фразы сессии</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.bestPhrase && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-green-500 font-medium">Лучшая фраза</div>
                <p className="text-sm italic">"{data.bestPhrase}"</p>
              </div>
            )}
            {data.weakestPhrase && data.weakestPhrase !== data.bestPhrase && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-orange-500 font-medium">Фраза с ошибками</div>
                <p className="text-sm italic">"{data.weakestPhrase}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button
          size="lg" className="flex-1 gap-2 shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]"
          onClick={handleNewSession}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shuffle className="w-5 h-5" />}
          Начать новую ситуацию
        </Button>
        <Button
          size="lg" variant="outline" className="flex-1 gap-2"
          onClick={() => setLocation("/dashboard")}
        >
          <LayoutDashboard className="w-5 h-5" />
          Вернуться в панель
        </Button>
      </div>
    </div>
  );
}

function StatCell({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-background/50 rounded-xl border border-border px-3 py-3 text-center">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-orange-500" : "bg-destructive";
  const textColor = pct >= 80 ? "text-green-500" : pct >= 60 ? "text-orange-500" : "text-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${textColor}`}>{pct}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
