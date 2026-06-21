import {
  useGetSpeakTutorSession,
  useEndSpeakTutorSession,
  useSendSpeakTutorMessage,
  useTranscribeSpeakTutor,
  useTextToSpeechSpeakTutor,
  useCreateSpeakTutorSession,
  getGetSpeakTutorSessionQueryKey,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic, Square, Loader2, PlayCircle, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Flag, Shuffle, Volume2, Lightbulb, EyeOff, Eye, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { PaywallModal } from "@/components/PaywallModal";
import { useGetSpeakTutorProfile, getGetSpeakTutorProfileQueryKey } from "@workspace/api-client-react";

const MIN_RECORDING_MS = 1000;

type Hint = {
  markerWord: string;
  usefulPhrase: string;
  explanationRu: string;
  exampleAnswer: string;
};

type MessageInfo = {
  userMessagesUsed: number;
  userMessagesTotal: number;
  userMessagesRemaining: number;
};

export default function Session() {
  const { id } = useParams();
  const sessionId = Number(id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading } = useGetSpeakTutorSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: getGetSpeakTutorSessionQueryKey(sessionId) },
  });
  const { data: profile } = useGetSpeakTutorProfile();

  const sendMessage   = useSendSpeakTutorMessage();
  const transcribe    = useTranscribeSpeakTutor();
  const tts           = useTextToSpeechSpeakTutor();
  const endSession    = useEndSpeakTutorSession();
  const createSession = useCreateSpeakTutorSession();

  const [isRecording, setIsRecording]                 = useState(false);
  const [isProcessing, setIsProcessing]               = useState(false);
  const [processingStage, setProcessingStage]         = useState<"transcribing" | "analyzing" | "tts" | null>(null);
  const [isPlaying, setIsPlaying]                     = useState(false);
  const [voiceError, setVoiceError]                   = useState("");
  const [introLoading, setIntroLoading]               = useState(false);
  const [expandedCorrections, setExpandedCorrections] = useState<Record<number, boolean>>({});
  const [hint, setHint]                               = useState<Hint | null>(null);
  const [hintLoading, setHintLoading]                 = useState(false);
  const [hintVisible, setHintVisible]                 = useState(false);
  const [hintShowAnswer, setHintShowAnswer]           = useState(false);
  const [paywallReason, setPaywallReason]             = useState<"purchase" | "extension">("purchase");
  const [paywallOpen, setPaywallOpen]                 = useState(false);
  const [messageInfo, setMessageInfo]                 = useState<MessageInfo | null>(null);

  const mediaRecorder  = useRef<MediaRecorder | null>(null);
  const audioChunks    = useRef<BlobPart[]>([]);
  const scrollRef      = useRef<HTMLDivElement>(null);
  const audioPlayer    = useRef<HTMLAudioElement | null>(null);
  const recordingStart = useRef<number>(0);
  const sessionStart   = useRef<number>(Date.now());
  const introTriggered = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionData?.messages, isProcessing, introLoading]);

  useEffect(() => {
    if (introTriggered.current || !sessionData) return;
    if (sessionData.messages.length > 0) return;
    introTriggered.current = true;
    triggerIntro();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  // Initialise message info from session data (paid sessions only)
  useEffect(() => {
    if (!sessionData) return;
    const s = sessionData.session as {
      isDemoSession?: boolean;
      userMessagesUsed?: number;
      includedUserMessages?: number;
      purchasedExtraUserMessages?: number;
    };
    if (s.isDemoSession) return;
    if (messageInfo === null) {
      const total = (s.includedUserMessages ?? 6) + (s.purchasedExtraUserMessages ?? 0);
      setMessageInfo({
        userMessagesUsed: s.userMessagesUsed ?? 0,
        userMessagesTotal: total,
        userMessagesRemaining: Math.max(0, total - (s.userMessagesUsed ?? 0)),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  const getAuthHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("speaktutor_jwt") ?? ""}`,
  });

  const triggerIntro = async () => {
    setIntroLoading(true);
    try {
      const res = await fetch(`/api/speaktutor/sessions/${sessionId}/intro`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { message: { id: number; role: string; text: string; createdAt: string }; audioBase64: string | null };
      await queryClient.invalidateQueries({ queryKey: getGetSpeakTutorSessionQueryKey(sessionId) });
      if (data.audioBase64) playAudioBase64(data.audioBase64);
    } catch {
      // non-blocking
    } finally {
      setIntroLoading(false);
    }
  };

  const fetchHint = async () => {
    setHintLoading(true);
    setHintShowAnswer(false);
    try {
      const res = await fetch(`/api/speaktutor/sessions/${sessionId}/hint`, {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as Hint;
      setHint(data);
      setHintVisible(true);
    } catch {
      // non-fatal
    } finally {
      setHintLoading(false);
    }
  };

  const toggleCorrection = (msgId: number) => {
    setExpandedCorrections((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const playAudioBase64 = useCallback((base64: string) => {
    if (audioPlayer.current) audioPlayer.current.pause();
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audioPlayer.current = audio;
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().catch(() => setIsPlaying(false));
  }, []);

  const handleStartRecording = async () => {
    if (isProcessing || isRecording) return;
    setVoiceError("");
    // Free user limit: check BEFORE starting mic — no recording, no transcription, no "Ничего не услышали"
    if (profile && profile.paymentStatus !== "paid" && (profile.demoCompleted || profile.demoRepliesRemaining <= 0)) {
      setPaywallReason("purchase");
      setPaywallOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPlayer.current) { audioPlayer.current.pause(); setIsPlaying(false); }
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      recorder.onstop = () => {
        const duration = Date.now() - recordingStart.current;
        const blob = new Blob(audioChunks.current, { type: mimeType ?? "audio/webm" });
        audioChunks.current = [];
        stream.getTracks().forEach((t) => t.stop());
        if (duration < MIN_RECORDING_MS) {
          setVoiceError("Запись слишком короткая. Нажмите и держите кнопку — скажите ответ полностью.");
          return;
        }
        processAudio(blob, mimeType ?? "audio/webm");
      };
      audioChunks.current = [];
      recordingStart.current = Date.now();
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
    } catch {
      setVoiceError("Нет доступа к микрофону. Разрешите доступ в настройках браузера.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setVoiceError("");
    setHintVisible(false);
    try {
      const base64data = await blobToBase64(blob);

      setProcessingStage("transcribing");
      let transcribeRes: { text: string };
      try {
        transcribeRes = await transcribe.mutateAsync({ data: { audioBase64: base64data, mimeType } });
      } catch {
        setVoiceError("Не удалось распознать голос. Попробуйте говорить чуть громче.");
        return;
      }

      if (!transcribeRes.text?.trim()) {
        setVoiceError("Ничего не услышали. Попробуйте ещё раз.");
        return;
      }

      setProcessingStage("analyzing");
      let response: Awaited<ReturnType<typeof sendMessage.mutateAsync>>;
      try {
        response = await sendMessage.mutateAsync({ sessionId, data: { text: transcribeRes.text, audioBase64: base64data } });
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: string } } };
        const code = e?.response?.data?.error;
        if (code === "DEMO_LIMIT_REACHED") {
          setPaywallReason("purchase");
          setPaywallOpen(true);
          return;
        }
        if (code === "SESSION_MESSAGE_LIMIT_REACHED") {
          setPaywallReason("extension");
          setPaywallOpen(true);
          return;
        }
        if (code === "SESSION_MAX_MESSAGES_REACHED") {
          await handleEndSession();
          return;
        }
        setVoiceError("Ошибка анализа ответа. Повторите попытку.");
        return;
      }

      // Sync message info from response
      const mi = (response as { messageInfo?: MessageInfo }).messageInfo;
      if (mi) {
        setMessageInfo(mi);
        // If no messages remaining after this one, auto-trigger extension paywall
        if (mi.userMessagesRemaining === 0) {
          // Show paywall on next mic press, don't interrupt current flow
        }
      }

      await queryClient.invalidateQueries({ queryKey: getGetSpeakTutorSessionQueryKey(sessionId) });
      await queryClient.invalidateQueries({ queryKey: getGetSpeakTutorProfileQueryKey() });

      if (response.assistantMessage.text) {
        setProcessingStage("tts");
        try {
          const ttsRes = await tts.mutateAsync({ data: { text: response.assistantMessage.text } });
          playAudioBase64(ttsRes.audioBase64);
        } catch { /* non-fatal */ }
      }
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const playExistingAudio = async (text: string) => {
    if (isPlaying) { audioPlayer.current?.pause(); setIsPlaying(false); return; }
    try {
      const ttsRes = await tts.mutateAsync({ data: { text } });
      playAudioBase64(ttsRes.audioBase64);
    } catch { /* non-fatal */ }
  };

  const handleEndSession = async () => {
    const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000);
    try {
      await endSession.mutateAsync({ sessionId, data: { durationSeconds } });
    } catch { /* best-effort */ }
    setLocation(`/session/${sessionId}/summary`);
  };

  const handleNewScenario = async () => {
    const durationSeconds = Math.round((Date.now() - sessionStart.current) / 1000);
    try { await endSession.mutateAsync({ sessionId, data: { durationSeconds } }); } catch { /* best-effort */ }
    createSession.mutate({ data: { scenarioId: "random" } }, {
      onSuccess: (session) => setLocation(`/speaktutor/session/${session.id}`),
    });
  };

  if (isLoading || !sessionData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { session, messages } = sessionData;
  const hasUserSpoken = messages.some((m) => m.role === "user");

  const processingLabel = {
    transcribing: "Распознаём речь…",
    analyzing: "Анализируем вашу фразу…",
    tts: "Репетитор готовит ответ…",
  }[processingStage ?? "analyzing"] ?? "Обрабатываем запись…";

  const handleExtensionActivated = () => {
    // Refresh session to get updated message counts
    queryClient.invalidateQueries({ queryKey: getGetSpeakTutorSessionQueryKey(sessionId) });
    queryClient.invalidateQueries({ queryKey: getGetSpeakTutorProfileQueryKey() });
    // Optimistically add 7 messages
    setMessageInfo((prev) => prev ? {
      ...prev,
      userMessagesTotal: prev.userMessagesTotal + 7,
      userMessagesRemaining: prev.userMessagesRemaining + 7,
    } : null);
  };

  const handleSessionPurchaseActivated = () => {
    queryClient.invalidateQueries({ queryKey: getGetSpeakTutorProfileQueryKey() });
  };

  // Determine if user can still send messages
  const isDemoSession = (session as { isDemoSession?: boolean }).isDemoSession;
  const messagesRemaining = messageInfo?.userMessagesRemaining ?? null;
  const messagesTotal = messageInfo?.userMessagesTotal ?? null;
  const isMessageLimitReached = !isDemoSession && messagesRemaining !== null && messagesRemaining <= 0;

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <PaywallModal
        open={paywallOpen}
        variant={paywallReason}
        sessionId={sessionId}
        onClose={() => setPaywallOpen(false)}
        onActivated={paywallReason === "extension" ? handleExtensionActivated : handleSessionPurchaseActivated}
      />

      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className={`absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(0,229,255,0.04)_0%,transparent_70%)] blur-3xl transition-opacity duration-1000 ${isRecording ? "opacity-100" : "opacity-30"}`} />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-card/50 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0 truncate max-w-[160px]">
            {session.scenarioTitle}
          </Badge>
          {/* Message counter badge (paid sessions only) */}
          {messageInfo !== null && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
              messagesRemaining !== null && messagesRemaining <= 1
                ? "border-orange-500/40 bg-orange-500/10 text-orange-500"
                : "border-primary/30 bg-primary/5 text-primary"
            }`}>
              <MessageSquare className="w-3 h-3" />
              Сообщений: {messagesRemaining} из {messagesTotal}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRecording ? "bg-red-500" : "bg-primary"}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRecording ? "bg-red-500" : "bg-primary"}`} />
            </span>
            {isRecording ? "Запись…" : "Сессия активна"}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline" size="sm"
            className="gap-1.5 text-muted-foreground hover:text-primary hover:border-primary/50"
            onClick={handleNewScenario}
            disabled={createSession.isPending || endSession.isPending}
          >
            {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            <span className="hidden sm:inline">Новая ситуация</span>
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleEndSession}
            disabled={endSession.isPending}
          >
            {endSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4 mr-1.5" />}
            <span className="hidden sm:inline">Завершить сессию</span>
          </Button>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {introLoading && (
            <div className="flex items-start">
              <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">ИИ готовит введение…</span>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`relative max-w-[85%] rounded-2xl p-4 md:p-5 ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border shadow-sm rounded-tl-sm"}`}>
                {msg.role === "assistant" && (
                  <Button
                    variant="ghost" size="icon"
                    className="absolute -left-12 top-2 rounded-full w-8 h-8 bg-background border border-border shadow-sm hover:bg-secondary"
                    onClick={() => playExistingAudio(msg.text)}
                  >
                    <PlayCircle className="w-5 h-5" />
                  </Button>
                )}

                {msg.role === "assistant" ? (
                  <IntroMessage text={msg.text} />
                ) : (
                  <p className="text-[15px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                )}
              </div>

              {msg.role === "user" && msg.correction && (
                <CorrectionCard
                  msg={{ id: msg.id, correction: msg.correction }}
                  expanded={!!expandedCorrections[msg.id]}
                  onToggle={() => toggleCorrection(msg.id)}
                />
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-start">
              <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{processingLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hint card */}
      {hintVisible && hint && (
        <div className="z-20 px-4 md:px-8 pb-2">
          <div className="max-w-3xl mx-auto">
            <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Подсказка
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHintVisible(false)}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-3">
                  <div className="bg-background rounded-lg px-3 py-2 border border-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Слово-маркер</div>
                    <div className="font-semibold text-primary text-sm">{hint.markerWord}</div>
                  </div>
                  <div className="bg-background rounded-lg px-3 py-2 border border-border flex-1 min-w-[160px]">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Полезная фраза</div>
                    <div className="font-medium text-sm italic">"{hint.usefulPhrase}"</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{hint.explanationRu}</p>

                {!hintShowAnswer ? (
                  <Button
                    variant="outline" size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => setHintShowAnswer(true)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Показать пример ответа
                  </Button>
                ) : (
                  <div className="bg-background rounded-lg px-3 py-2 border border-border space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <EyeOff className="w-3 h-3" />
                      Пример ответа
                    </div>
                    <p className="text-sm font-medium">{hint.exampleAnswer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-20 shrink-0">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          {voiceError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 w-full max-w-sm text-center justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Message limit reached — show extension prompt inline */}
          {isMessageLimitReached && !paywallOpen && (
            <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 w-full max-w-sm">
              <MessageSquare className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-sm text-orange-400 flex-1">Сообщения закончились</span>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                onClick={() => { setPaywallReason("extension"); setPaywallOpen(true); }}
              >
                +7 сообщ.
              </Button>
            </div>
          )}

          <div className="flex items-center gap-6">
            {/* Hint button */}
            <Button
              variant="outline" size="sm"
              className={`gap-2 rounded-full px-4 transition-all ${hintVisible ? "border-primary text-primary" : "text-muted-foreground"}`}
              onClick={hintVisible ? () => setHintVisible(false) : fetchHint}
              disabled={hintLoading || isProcessing}
            >
              {hintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              Подсказка
            </Button>

            {/* Mic button */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isRecording ? "animate-ping bg-red-500/30 scale-150" : ""}`} />
              <button
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 ${
                  isProcessing
                    ? "bg-muted cursor-not-allowed"
                    : isMessageLimitReached
                    ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                    : isRecording
                    ? "bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)] focus:ring-red-500/30"
                    : "bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_rgba(0,229,255,0.5)] focus:ring-primary/30"
                }`}
                onMouseDown={isMessageLimitReached ? () => { setPaywallReason("extension"); setPaywallOpen(true); } : handleStartRecording}
                onMouseUp={isMessageLimitReached ? undefined : handleStopRecording}
                onTouchStart={isMessageLimitReached ? () => { setPaywallReason("extension"); setPaywallOpen(true); } : handleStartRecording}
                onTouchEnd={isMessageLimitReached ? undefined : handleStopRecording}
                disabled={isProcessing}
                aria-label={isRecording ? "Остановить запись" : "Начать запись"}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                ) : isRecording ? (
                  <Square className="w-8 h-8 text-white fill-white" />
                ) : isMessageLimitReached ? (
                  <MessageSquare className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-primary-foreground" />
                )}
              </button>
            </div>

            {/* Placeholder for layout symmetry */}
            <div className="w-[90px]" />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {isProcessing
              ? processingLabel
              : isMessageLimitReached
              ? "Нажмите, чтобы продолжить диалог"
              : isRecording
              ? "Отпустите, чтобы отправить"
              : hasUserSpoken
              ? "Ответьте на вопрос, чтобы продолжить диалог"
              : "Ответьте на вопрос, чтобы начать диалог"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function IntroMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isEnglishLine = /^[A-Z"']/.test(line.trim()) && !/[а-яё]/i.test(line);
        if (isEnglishLine) {
          return (
            <p key={i} className="text-[17px] leading-relaxed font-semibold text-foreground">
              {line}
            </p>
          );
        }
        return (
          <p key={i} className={`text-[14px] leading-relaxed ${line.includes("Ответь") ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

type CorrectionData = {
  score?: number;
  originalText?: string;
  correctedText?: string;
  grammarMistakes?: string[];
  vocabularyMistakes?: string[];
  pronunciationWarnings?: string[];
  nativeSpeakerVersion?: string;
  explanationRu?: string;
  naturalnessScore?: number;
};

function CorrectionCard({
  msg,
  expanded,
  onToggle,
}: {
  msg: { id: number; correction: unknown };
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = msg.correction as CorrectionData;
  const score = c.score ?? 7;
  const hasErrors =
    (c.grammarMistakes?.length ?? 0) > 0 ||
    (c.vocabularyMistakes?.length ?? 0) > 0 ||
    (c.pronunciationWarnings?.length ?? 0) > 0;

  const scoreColor =
    score >= 9 ? "text-green-500" : score >= 7 ? "text-primary" : score >= 5 ? "text-orange-500" : "text-destructive";

  return (
    <div className="mt-2 w-full max-w-[85%] self-end">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-card border border-border rounded-xl text-sm hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
          <span className="text-muted-foreground text-xs">
            {hasErrors ? "Есть ошибки — нажми для разбора" : "Всё верно!"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${scoreColor}`}>{score}/10</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-1 bg-card border border-border rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {c.explanationRu && (
            <p className="text-sm text-muted-foreground leading-relaxed">{c.explanationRu}</p>
          )}
          {c.correctedText && c.correctedText !== c.originalText && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Исправление</div>
              <p className="text-sm font-medium text-green-400">✓ {c.correctedText}</p>
            </div>
          )}
          {c.nativeSpeakerVersion && c.nativeSpeakerVersion !== c.originalText && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Как скажет носитель</div>
              <p className="text-sm italic text-primary/80">"{c.nativeSpeakerVersion}"</p>
            </div>
          )}
          {(c.grammarMistakes?.length ?? 0) > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Грамматика</div>
              {c.grammarMistakes!.map((m, i) => (
                <div key={i} className="text-xs text-orange-400 flex items-start gap-1.5 mt-0.5">
                  <span className="shrink-0 mt-0.5">•</span>{m}
                </div>
              ))}
            </div>
          )}
          {(c.vocabularyMistakes?.length ?? 0) > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Словарный запас</div>
              {c.vocabularyMistakes!.map((m, i) => (
                <div key={i} className="text-xs text-orange-400 flex items-start gap-1.5 mt-0.5">
                  <span className="shrink-0 mt-0.5">•</span>{m}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
