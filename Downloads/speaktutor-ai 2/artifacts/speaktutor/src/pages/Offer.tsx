import { Link } from "wouter";
import { Mic, ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const PDF_URL = `${import.meta.env.BASE_URL}offer.pdf`;

export default function Offer() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary cursor-pointer">
              <Mic className="w-5 h-5" />
              SpeakTutor AI
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href={PDF_URL} download="speaktutor-offer.pdf" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                <Download className="w-4 h-4" />
                Скачать PDF
              </Button>
            </a>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Page title */}
      <div className="container mx-auto px-4 pt-6 pb-3 max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Пользовательское соглашение / Оферта</h1>
              <p className="text-xs text-muted-foreground">Официальный документ</p>
            </div>
          </div>
          {/* Mobile download */}
          <a href={PDF_URL} download="speaktutor-offer.pdf" target="_blank" rel="noreferrer" className="sm:hidden">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </a>
        </div>
      </div>

      {/* PDF viewer */}
      <div className="flex-1 container mx-auto px-4 pb-6 max-w-5xl">
        {/* Desktop/tablet: iframe viewer */}
        <div className="hidden sm:block w-full rounded-xl overflow-hidden border border-border" style={{ height: "calc(100vh - 180px)", minHeight: 500 }}>
          <object
            data={PDF_URL}
            type="application/pdf"
            className="w-full h-full"
            aria-label="Пользовательское соглашение"
          >
            {/* Fallback if browser can't show PDF inline */}
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground p-8 text-center">
              <FileText className="w-12 h-12 text-primary/40" />
              <p className="text-base font-medium text-foreground">Браузер не поддерживает встроенный просмотр PDF</p>
              <p className="text-sm">Нажмите кнопку ниже, чтобы открыть или скачать документ</p>
              <a href={PDF_URL} target="_blank" rel="noreferrer" download="speaktutor-offer.pdf">
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Открыть документ
                </Button>
              </a>
            </div>
          </object>
        </div>

        {/* Mobile: open/download card */}
        <div className="sm:hidden flex flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Пользовательское соглашение</h2>
            <p className="text-sm text-muted-foreground">Официальный документ в формате PDF</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <a href={PDF_URL} target="_blank" rel="noreferrer">
              <Button className="w-full gap-2">
                <FileText className="w-4 h-4" />
                Открыть документ
              </Button>
            </a>
            <a href={PDF_URL} download="speaktutor-offer.pdf">
              <Button variant="outline" className="w-full gap-2">
                <Download className="w-4 h-4" />
                Скачать PDF
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground max-w-xs">
            По вопросам, связанным с документом:{" "}
            <a href="mailto:facemax1@mail.ru" className="text-primary hover:underline">
              facemax1@mail.ru
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-border py-4">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 SpeakTutor AI ·{" "}
          <a href="mailto:facemax1@mail.ru" className="text-primary hover:underline">facemax1@mail.ru</a>
        </p>
      </div>
    </div>
  );
}
