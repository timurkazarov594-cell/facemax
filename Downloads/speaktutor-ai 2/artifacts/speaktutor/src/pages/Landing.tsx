import { Link } from "wouter";
import { Mic, ArrowRight, Zap, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <Mic className="w-6 h-6" />
          SpeakTutor AI
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">Войти</Button>
          </Link>
          <Link href="/register">
            <Button>Начать бесплатно</Button>
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 text-center relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50 blur-3xl"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Новый уровень изучения языка</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Говорите по-английски <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              без страха и ошибок
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Персональный ИИ-репетитор для русскоязычных. Практикуйте устную речь в реальных сценариях, получайте мгновенные исправления грамматики и прокачивайте свой уровень как в игре.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 h-auto w-full sm:w-auto font-semibold gap-2 shadow-[0_0_40px_-10px_rgba(0,229,255,0.5)]">
                Попробовать сейчас
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/50 bg-card/30 py-24">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Говорите — не читайте</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Реальные голосовые диалоги с ИИ. Whisper распознаёт вашу речь, GPT-4o отвечает как живой собеседник.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Мгновенные исправления</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Каждый ответ анализируется: грамматика, словарный запас, произношение. Ошибки исправляются на месте.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">30 реальных сценариев</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Кафе, аэропорт, деловые переговоры, собеседование — практикуйте язык в ситуациях из жизни.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Готовы начать говорить?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Первые сообщения — бесплатно. Без кредитной карты.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 h-auto font-semibold gap-2 shadow-[0_0_40px_-10px_rgba(0,229,255,0.5)]">
                Создать аккаунт бесплатно
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary" />
            <span className="font-semibold text-primary">SpeakTutor AI</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/offer" className="hover:text-primary transition-colors">
              Оферта
            </Link>
            <a href="mailto:facemax1@mail.ru" className="hover:text-primary transition-colors">
              Поддержка
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
