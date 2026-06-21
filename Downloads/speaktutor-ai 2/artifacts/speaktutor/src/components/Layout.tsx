import { Link, useLocation } from "wouter";
import { Mic, LayoutDashboard, Target, Trophy, BarChart2, BookOpen, LogOut, Menu, ShoppingCart, FileText, HeadphonesIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PaywallModal } from "@/components/PaywallModal";
import { useGetSpeakTutorProfile } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const supportRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useGetSpeakTutorProfile();
  const isPaid = profile?.isPaid ?? false;

  const handleLogout = () => {
    logout();
    window.location.href = import.meta.env.BASE_URL + "login";
  };

  // Close support popup on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    }
    if (supportOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [supportOpen]);

  const navItems = [
    { href: "/dashboard",    label: "Панель управления", icon: LayoutDashboard },
    { href: "/practice",     label: "Практика",          icon: Target },
    { href: "/vocabulary",   label: "Словарь",           icon: BookOpen },
    { href: "/achievements", label: "Достижения",        icon: Trophy },
    { href: "/analytics",    label: "Аналитика",         icon: BarChart2 },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur border-r border-border">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <Mic className="w-6 h-6" />
          SpeakTutor
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 ${isActive ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-2">
        <Button
          className="w-full gap-2 shadow-[0_0_15px_-5px_rgba(0,229,255,0.4)]"
          size="sm"
          onClick={() => { setOpen(false); setPaywallOpen(true); }}
        >
          <ShoppingCart className="w-4 h-4" />
          {isPaid ? "Купить ещё сессии" : "Купить 5 сессий · 499 ₽"}
        </Button>
        {/* Оферта link */}
        <Link href="/offer">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground text-xs"
            onClick={() => setOpen(false)}
          >
            <FileText className="w-4 h-4" />
            Оферта
          </Button>
        </Link>
        {user && (
          <p className="text-xs text-muted-foreground px-3 truncate">{user.email}</p>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
          Выйти
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PaywallModal
        open={paywallOpen}
        variant="purchase"
        onClose={() => setPaywallOpen(false)}
        onActivated={() => setPaywallOpen(false)}
      />

      <div className="hidden md:block w-64 h-full">
        <NavContent />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur z-10 shrink-0">
          {/* Mobile: hamburger + brand */}
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-border">
                <NavContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-bold text-primary">
              <Mic className="w-5 h-5" />
              SpeakTutor
            </div>
          </div>

          {/* Desktop: empty left side */}
          <div className="hidden md:block" />

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Support popup */}
            <div className="relative" ref={supportRef}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setSupportOpen((v) => !v)}
              >
                <HeadphonesIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Поддержка</span>
              </Button>

              {supportOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Служба поддержки</span>
                    <button onClick={() => setSupportOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    По всем вопросам пишите нам на почту:{" "}
                    <a
                      href="mailto:facemax1@mail.ru"
                      className="text-primary font-medium hover:underline"
                    >
                      facemax1@mail.ru
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Buy sessions button */}
            <Button
              size="sm"
              className="gap-2 shadow-[0_0_15px_-5px_rgba(0,229,255,0.4)]"
              onClick={() => setPaywallOpen(true)}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{isPaid ? "Купить ещё сессии" : "Купить 5 сессий · 499 ₽"}</span>
              <span className="sm:hidden">499 ₽</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
