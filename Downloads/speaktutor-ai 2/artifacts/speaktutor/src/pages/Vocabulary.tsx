import { useListSpeakTutorVocabulary } from "@workspace/api-client-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  BookOpen, Search, CheckCircle2, AlertCircle, Brain,
  Loader2, Trash2, Heart, RotateCcw, Target, TrendingUp, Zap,
  BookMarked, MessageSquareDashed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getListSpeakTutorVocabularyQueryKey } from "@workspace/api-client-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Word = {
  id: number; word: string; translation: string; explanation: string | null;
  exampleSentence: string | null; sessionExample: string | null;
  wordType: string; difficulty: string;
  isMastered: boolean; isFavorite: boolean;
  timesSeenWrong: number; timesReviewed: number; timesCorrect: number;
  intervalDays: number; nextReviewAt: string | null; addedAt: string;
};

type ReviewWord = Word & { choices: string[] };

type Tab = "all" | "new" | "difficult" | "phrases" | "mistakes" | "favorites";
type ReviewStage = "idle" | "question" | "flip" | "rate" | "done";

// ── API helpers ───────────────────────────────────────────────────────────────

function authHeader() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("speaktutor_jwt") ?? ""}` };
}

async function patchWord(id: number, update: Record<string, unknown>) {
  const res = await fetch(`/api/speaktutor/vocabulary/${id}`, { method: "PATCH", headers: authHeader(), body: JSON.stringify(update) });
  return res.json();
}

async function reviewWord(id: number, result: string) {
  const res = await fetch(`/api/speaktutor/vocabulary/${id}/review`, { method: "POST", headers: authHeader(), body: JSON.stringify({ result }) });
  return res.json();
}

async function deleteWord(id: number) {
  await fetch(`/api/speaktutor/vocabulary/${id}`, { method: "DELETE", headers: authHeader() });
}

async function fetchDueStats(): Promise<{ dueCount: number; stats: { total: number; mastered: number; difficult: number; accuracy: number; totalReviewed: number } }> {
  const res = await fetch("/api/speaktutor/vocabulary/due", { headers: authHeader() });
  return res.json();
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Vocabulary() {
  const { data: words, isLoading } = useListSpeakTutorVocabulary();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [reviewMode, setReviewMode] = useState(false);
  const [dueStats, setDueStats] = useState<{ dueCount: number; stats: { total: number; mastered: number; difficult: number; accuracy: number; totalReviewed: number } } | null>(null);
  const [pendingOps, setPendingOps] = useState<Set<number>>(new Set());
  const [xpFlash, setXpFlash] = useState<number | null>(null);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListSpeakTutorVocabularyQueryKey() });
  }, [queryClient]);

  const loadDueStats = useCallback(async () => {
    try { setDueStats(await fetchDueStats()); } catch { /* ignore */ }
  }, []);

  // Load stats once
  useState(() => { loadDueStats(); });

  const filteredWords = useMemo(() => {
    const all = (words as Word[] | undefined) ?? [];
    const now = new Date();
    const searched = all.filter((w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase())
    );
    switch (tab) {
      case "new":       return searched.filter((w) => !w.timesReviewed);
      case "difficult": return searched.filter((w) => w.timesSeenWrong >= 2 || (!w.isMastered && w.timesReviewed >= 3));
      case "phrases":   return searched.filter((w) => w.wordType === "phrase");
      case "mistakes":  return searched.filter((w) => w.wordType === "mistake");
      case "favorites": return searched.filter((w) => w.isFavorite);
      default:          return searched;
    }
  }, [words, search, tab]);

  const dueWords = useMemo(() => {
    const all = (words as Word[] | undefined) ?? [];
    const now = new Date();
    return all.filter((w) => !w.nextReviewAt || new Date(w.nextReviewAt) <= now);
  }, [words]);

  const handleFavorite = async (word: Word) => {
    setPendingOps((s) => new Set(s).add(word.id));
    await patchWord(word.id, { isFavorite: !word.isFavorite });
    invalidate();
    setPendingOps((s) => { const n = new Set(s); n.delete(word.id); return n; });
  };

  const handleMastered = async (word: Word) => {
    setPendingOps((s) => new Set(s).add(word.id));
    await patchWord(word.id, { isMastered: !word.isMastered });
    invalidate();
    setPendingOps((s) => { const n = new Set(s); n.delete(word.id); return n; });
  };

  const handleDelete = async (id: number) => {
    setPendingOps((s) => new Set(s).add(id));
    await deleteWord(id);
    invalidate();
    loadDueStats();
  };

  const startReview = () => {
    if (dueWords.length === 0) return;
    setReviewMode(true);
  };

  if (reviewMode && dueWords.length > 0) {
    return (
      <ReviewSession
        words={dueWords}
        allWords={(words as Word[] | undefined) ?? []}
        onFinish={() => { setReviewMode(false); invalidate(); loadDueStats(); }}
        onXp={(xp) => { setXpFlash(xp); setTimeout(() => setXpFlash(null), 2000); }}
      />
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all",       label: "Все",          count: (words as Word[] | undefined)?.length },
    { key: "new",       label: "Новые",        count: (words as Word[] | undefined)?.filter((w) => !w.timesReviewed).length },
    { key: "difficult", label: "Трудные",      count: (words as Word[] | undefined)?.filter((w) => w.timesSeenWrong >= 2).length },
    { key: "phrases",   label: "Фразы",        count: (words as Word[] | undefined)?.filter((w) => w.wordType === "phrase").length },
    { key: "mistakes",  label: "Мои ошибки",   count: (words as Word[] | undefined)?.filter((w) => w.wordType === "mistake").length },
    { key: "favorites", label: "Избранные",    count: (words as Word[] | undefined)?.filter((w) => w.isFavorite).length },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* XP flash */}
      {xpFlash !== null && (
        <div className="fixed top-6 right-6 z-50 bg-yellow-500 text-yellow-950 px-4 py-2 rounded-full font-bold text-sm shadow-lg animate-in slide-in-from-top-4">
          +{xpFlash} XP
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Мой словарь
          </h1>
          <p className="text-muted-foreground">Слова из ваших сессий. Повторяйте каждый день.</p>
        </div>
        {dueWords.length > 0 && (
          <Button
            size="lg" onClick={startReview}
            className="gap-2 shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)] shrink-0"
          >
            <Brain className="w-5 h-5" />
            Начать повторение
            <Badge className="bg-primary-foreground text-primary ml-1">{dueWords.length}</Badge>
          </Button>
        )}
      </div>

      {/* Stats */}
      {dueStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard icon={<BookMarked className="w-4 h-4" />} label="Всего слов"  value={dueStats.stats.total} />
          <StatCard icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Выучено"   value={dueStats.stats.mastered} color="text-green-500" />
          <StatCard icon={<AlertCircle  className="w-4 h-4 text-orange-500" />} label="Трудных"  value={dueStats.stats.difficult} color="text-orange-500" />
          <StatCard icon={<Target       className="w-4 h-4 text-primary" />}    label="Точность" value={`${dueStats.stats.accuracy}%`} color="text-primary" />
          <StatCard icon={<Zap          className="w-4 h-4 text-yellow-500" />} label="На сегодня" value={dueWords.length} color={dueWords.length > 0 ? "text-yellow-500" : undefined} />
        </div>
      )}

      {/* Search + Tabs */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по словарю…" className="pl-9 bg-card/50" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.key} size="sm"
              variant={tab === t.key ? "default" : "outline"}
              className={`gap-1.5 ${tab === t.key ? "shadow-[0_0_12px_-3px_rgba(0,229,255,0.4)]" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className={`text-xs ${tab === t.key ? "opacity-80" : "text-muted-foreground"}`}>
                  {t.count}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Words Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredWords.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word as Word}
              isPending={pendingOps.has(word.id)}
              onFavorite={() => handleFavorite(word as Word)}
              onMastered={() => handleMastered(word as Word)}
              onDelete={() => handleDelete(word.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── WordCard ─────────────────────────────────────────────────────────────────

function WordCard({ word, isPending, onFavorite, onMastered, onDelete }: {
  word: Word; isPending: boolean;
  onFavorite: () => void; onMastered: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const difficultyBadge: Record<string, { label: string; className: string }> = {
    easy:   { label: "Лёгкое",    className: "bg-green-500/10 text-green-500 border-green-500/20" },
    medium: { label: "Среднее",   className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    hard:   { label: "Сложное",   className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const typeBadge: Record<string, { label: string; icon: React.ReactNode }> = {
    word:    { label: "Слово",   icon: <BookMarked className="w-3 h-3" /> },
    phrase:  { label: "Фраза",   icon: <MessageSquareDashed className="w-3 h-3" /> },
    mistake: { label: "Ошибка",  icon: <AlertCircle className="w-3 h-3 text-destructive" /> },
  };

  const accuracy = word.timesReviewed
    ? Math.round((word.timesCorrect / word.timesReviewed) * 100)
    : null;

  const diff = difficultyBadge[word.difficulty] ?? difficultyBadge.medium;
  const type = typeBadge[word.wordType] ?? typeBadge.word;
  const isMistake = word.wordType === "mistake";

  return (
    <Card
      className={`bg-card/50 border-border/50 hover:border-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_-8px_rgba(0,229,255,0.2)] ${word.isMastered ? "border-green-500/20 bg-green-500/5" : ""} ${isMistake ? "border-destructive/20 bg-destructive/5" : ""}`}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {isMistake ? (
              <div className="space-y-1">
                <div className="text-sm line-through text-destructive/70 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {word.word}
                </div>
                <div className="font-bold text-lg text-green-500">{word.translation}</div>
              </div>
            ) : (
              <>
                <div className="font-bold text-xl text-primary truncate">{word.word}</div>
                <div className="text-sm text-muted-foreground">{word.translation}</div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost" size="icon" className={`h-7 w-7 ${word.isFavorite ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
              onClick={onFavorite} disabled={isPending}
            >
              <Heart className={`w-4 h-4 ${word.isFavorite ? "fill-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete} disabled={isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={diff.className}>{diff.label}</Badge>
          <Badge variant="outline" className="gap-1 text-xs">{type.icon}{type.label}</Badge>
          {word.isMastered && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle2 className="w-3 h-3" />Выучено</Badge>}
        </div>

        {/* Explanation */}
        {word.explanation && (
          <p className="text-sm text-muted-foreground leading-relaxed">{word.explanation}</p>
        )}

        {/* Expandable details */}
        <button
          className="text-xs text-primary/70 hover:text-primary transition-colors w-full text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Скрыть примеры ▲" : "Показать примеры ▼"}
        </button>

        {expanded && (
          <div className="space-y-2 pt-1">
            {word.exampleSentence && (
              <div className="bg-background/50 rounded-lg px-3 py-2 border border-border text-sm italic text-foreground">
                "{word.exampleSentence}"
              </div>
            )}
            {word.sessionExample && (
              <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/20 text-sm">
                <span className="text-[10px] uppercase tracking-wider text-primary/70 block mb-1">Из вашей сессии</span>
                "{word.sessionExample}"
              </div>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-3">
            {word.timesReviewed > 0 && <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" />{word.timesReviewed}×</span>}
            {accuracy !== null && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{accuracy}%</span>}
          </div>
          <Button
            variant="ghost" size="sm"
            className={`h-6 text-xs px-2 gap-1 ${word.isMastered ? "text-green-500" : "text-muted-foreground"}`}
            onClick={onMastered} disabled={isPending}
          >
            <CheckCircle2 className="w-3 h-3" />
            {word.isMastered ? "Выучено" : "Отметить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── ReviewSession ─────────────────────────────────────────────────────────────

function ReviewSession({ words, allWords, onFinish, onXp }: {
  words: Word[]; allWords: Word[];
  onFinish: () => void;
  onXp: (xp: number) => void;
}) {
  const [queue] = useState<Word[]>(() => [...words].sort(() => Math.random() - 0.5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stage, setStage] = useState<ReviewStage>("question");
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalDone, setTotalDone] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const current = queue[currentIdx];

  useEffect(() => {
    if (!current) return;
    const others = allWords
      .filter((w) => w.id !== current.id && w.wordType !== "mistake")
      .map((w) => w.translation)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    setChoices([current.translation, ...others].sort(() => Math.random() - 0.5));
    setSelected(null);
    setStage("question");
  }, [current?.id]);

  const goNext = useCallback(() => {
    if (currentIdx + 1 >= queue.length) {
      setIsDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentIdx, queue.length]);

  const handleChoice = useCallback(async (choice: string) => {
    if (selected || !current) return;
    setSelected(choice);
    const isCorrect = choice === current.translation;
    if (isCorrect) setTotalCorrect((n) => n + 1);
    setTotalDone((n) => n + 1);
    const data = await reviewWord(current.id, isCorrect ? "correct" : "incorrect");
    if (data.xpEarned) { setXpTotal((n) => n + data.xpEarned); onXp(data.xpEarned); }
    setTimeout(goNext, 1200);
  }, [selected, current, goNext, onXp]);

  const handleRate = useCallback(async (result: "easy" | "medium" | "hard") => {
    if (!current) return;
    const data = await reviewWord(current.id, result);
    if (data.xpEarned) { setXpTotal((n) => n + data.xpEarned); onXp(data.xpEarned); }
    if (result !== "hard") setTotalCorrect((n) => n + 1);
    setTotalDone((n) => n + 1);
    goNext();
  }, [current, goNext, onXp]);

  if (isDone || !current) {
    const accuracy = totalDone ? Math.round((totalCorrect / totalDone) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 animate-in fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Повторение завершено!</h1>
          <p className="text-muted-foreground">Слов повторено: {totalDone}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div><div className="text-4xl font-bold text-green-500">{totalCorrect}</div><div className="text-sm text-muted-foreground">Верных</div></div>
          <div><div className="text-4xl font-bold text-primary">{accuracy}%</div><div className="text-sm text-muted-foreground">Точность</div></div>
          {xpTotal > 0 && <div><div className="text-4xl font-bold text-yellow-500">+{xpTotal}</div><div className="text-sm text-muted-foreground">XP</div></div>}
        </div>
        <Button size="lg" onClick={onFinish} className="gap-2">
          <BookOpen className="w-5 h-5" />
          Вернуться к словарю
        </Button>
      </div>
    );
  }

  const isMistake = current.wordType === "mistake";
  const progressPct = Math.round((currentIdx / queue.length) * 100);
  const useMultipleChoice = (currentIdx % 2 === 0) && choices.length >= 2 && !isMistake;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{currentIdx + 1} / {queue.length}</span>
          <span className="text-yellow-500 font-medium">+{xpTotal} XP</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {useMultipleChoice ? (
          <>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Что означает это слово?</p>
              <h2 className="text-5xl font-bold text-primary">{current.word}</h2>
              {current.explanation && <p className="text-sm text-muted-foreground">{current.explanation}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {choices.map((choice) => {
                const isCorrect = choice === current.translation;
                const isSelected = selected === choice;
                return (
                  <button
                    key={choice}
                    onClick={() => handleChoice(choice)}
                    disabled={!!selected}
                    className={`rounded-2xl border-2 px-4 py-4 text-sm font-medium transition-all text-left ${
                      !selected ? "border-border hover:border-primary hover:bg-primary/5 bg-card" :
                      isCorrect ? "border-green-500 bg-green-500/10 text-green-500" :
                      isSelected ? "border-destructive bg-destructive/10 text-destructive" :
                      "border-border bg-card opacity-50"
                    }`}
                  >
                    {isSelected && !isCorrect && <span className="mr-1">✗</span>}
                    {isSelected && isCorrect && <span className="mr-1">✓</span>}
                    {!isSelected && selected && isCorrect && <span className="mr-1">✓</span>}
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {stage === "question" ? (
              <div className="text-center space-y-6">
                <p className="text-sm text-muted-foreground">Помните этот перевод?</p>
                <Card
                  className="bg-card/50 border-primary/30 shadow-[0_0_30px_-10px_rgba(0,229,255,0.2)] cursor-pointer hover:-translate-y-1 transition-all"
                  onClick={() => setStage("flip")}
                >
                  <CardContent className="p-12 text-center space-y-4">
                    {isMistake ? (
                      <div className="space-y-2">
                        <p className="text-xs text-destructive uppercase tracking-wider">Моя ошибка</p>
                        <p className="text-3xl font-bold line-through text-destructive/70">{current.word}</p>
                      </div>
                    ) : (
                      <h2 className="text-5xl font-bold text-primary">{current.word}</h2>
                    )}
                    {current.explanation && <p className="text-sm text-muted-foreground">{current.explanation}</p>}
                    <p className="text-xs text-muted-foreground mt-6">Нажмите, чтобы открыть перевод</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <Card className="bg-card/50 border-primary/30 shadow-[0_0_30px_-10px_rgba(0,229,255,0.2)]">
                  <CardContent className="p-8 text-center space-y-4">
                    {isMistake ? (
                      <div className="space-y-3">
                        <p className="text-sm text-destructive line-through">{current.word}</p>
                        <p className="text-3xl font-bold text-green-500">{current.translation}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-muted-foreground">{current.word}</p>
                        <h2 className="text-3xl font-bold">{current.translation}</h2>
                      </>
                    )}
                    {current.exampleSentence && (
                      <p className="text-sm text-muted-foreground italic border-t border-border/50 pt-3">
                        "{current.exampleSentence}"
                      </p>
                    )}
                    {current.sessionExample && (
                      <p className="text-sm text-primary/80 italic">
                        Из сессии: "{current.sessionExample}"
                      </p>
                    )}
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground font-medium">Как хорошо вы знали это?</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => handleRate("hard")}>Сложно</Button>
                  <Button variant="outline" className="border-orange-500/40 text-orange-500 hover:bg-orange-500/10" onClick={() => handleRate("medium")}>Средне</Button>
                  <Button variant="outline" className="border-green-500/40 text-green-500 hover:bg-green-500/10" onClick={() => handleRate("easy")}>Легко</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Button variant="ghost" size="sm" className="mt-8 text-muted-foreground" onClick={onFinish}>
        Выйти из повторения
      </Button>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`text-muted-foreground ${color ?? ""}`}>{icon}</div>
        <div>
          <div className={`text-xl font-bold ${color ?? ""}`}>{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, string> = {
    all:       "Словарь пуст. Начните практику — слова добавятся автоматически.",
    new:       "Нет новых слов для изучения.",
    difficult: "Трудных слов нет. Отличный результат!",
    phrases:   "Фраз пока нет.",
    mistakes:  "Ошибок не записано. Продолжайте практиковаться!",
    favorites: "Нет избранных слов. Нажмите ♥ на карточке, чтобы сохранить.",
  };
  return (
    <div className="text-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-card/20">
      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>{messages[tab]}</p>
    </div>
  );
}
