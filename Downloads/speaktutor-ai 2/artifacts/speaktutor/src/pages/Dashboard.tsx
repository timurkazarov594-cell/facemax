import { useGetSpeakTutorDashboard } from "@workspace/api-client-react";
import { Target, Zap, Flame, Clock, Trophy, TrendingUp, AlertTriangle, Crown, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { PaywallModal } from "@/components/PaywallModal";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetSpeakTutorDashboard();
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6">Не удалось загрузить данные.</div>;
  }

  const { profile, topMistakes, recentSessions, streakCalendar } = dashboard;
  const levelXPNeeded = 1000;
  const progressPercent = (profile.xp % levelXPNeeded) / levelXPNeeded * 100;
  const isPaid = profile.isPaid;
  const paidSessionsRemaining = profile.paidSessionsRemaining;

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <PaywallModal open={paywallOpen} variant="purchase" onClose={() => setPaywallOpen(false)} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">С возвращением, {profile.name || "Пользователь"}!</h1>
            <p className="text-muted-foreground mt-1">Готовы к новой тренировке?</p>
          </div>
        </div>
        <Link href="/practice">
          <Button size="lg" className="shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]">
            <Target className="mr-2 w-5 h-5" />
            Начать практику
          </Button>
        </Link>
      </div>

      {/* Session status banner */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
        isPaid
          ? paidSessionsRemaining <= 1
            ? "border-orange-500/30 bg-orange-500/5"
            : "border-border/50 bg-card/50"
          : "border-primary/20 bg-primary/5"
      }`}>
        <div className="flex-1 space-y-1">
          {isPaid ? (
            <>
              <span className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Доступно сессий: {paidSessionsRemaining}
              </span>
              <p className="text-xs text-muted-foreground">
                Каждая сессия — 6 сообщений. Расширение: +7 сообщений за 100 ₽.
              </p>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Пакет из 5 практических сессий — 499 ₽
              </span>
              <p className="text-xs text-muted-foreground">
                6 сообщений в каждой сессии · 10 сценариев · Анализ речи
              </p>
            </>
          )}
        </div>
        {(!isPaid || paidSessionsRemaining <= 1) && (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setPaywallOpen(true)}>
            <Crown className="w-3.5 h-3.5" />
            {isPaid ? "Купить ещё" : "Купить сессии"}
          </Button>
        )}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">XP (Опыт)</p>
              <p className="text-2xl font-bold">{profile.xp}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-orange-500/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ударный режим</p>
              <p className="text-2xl font-bold">{profile.streak} дней</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-secondary/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Время общения</p>
              <p className="text-2xl font-bold">{profile.totalSpeakingMinutes} мин</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-chart-3/50 transition-colors">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center text-chart-3 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Грамматика</p>
              <p className="text-2xl font-bold">{profile.grammarScore}/100</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Progress & Mistakes */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Прогресс уровня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Текущий уровень</div>
                  <div className="text-xl font-bold uppercase tracking-wider text-primary">{profile.level}</div>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {profile.xp % levelXPNeeded} / {levelXPNeeded} XP
                </div>
              </div>
              <Progress value={progressPercent} className="h-3 bg-secondary/20" />
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Зоны роста (Частые ошибки)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topMistakes.length > 0 ? (
                <div className="space-y-4">
                  {topMistakes.map((mistake, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-sm font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium">{mistake.mistake}</div>
                          <div className="text-xs text-muted-foreground capitalize">{mistake.category}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-muted-foreground">
                        {mistake.count} раз
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  Пока нет данных об ошибках. Начните практику!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Sessions */}
        <div className="space-y-8">
          <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
            <CardHeader>
              <CardTitle>Недавние сессии</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <Link key={session.id} href={`/session/${session.id}`}>
                      <div className="p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold group-hover:text-primary transition-colors line-clamp-1">{session.scenarioTitle}</div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {new Date(session.startedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {session.durationSeconds ? Math.floor(session.durationSeconds / 60) : 0} мин
                          </div>
                          {session.overallScore && (
                            <div className="font-medium text-chart-3 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-chart-3 text-chart-3" />
                              {session.overallScore.toFixed(1)}/10
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                  Нет завершенных сессий
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Just importing Star here since it's used in the component
import { Star } from "lucide-react";
