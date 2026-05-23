import React from 'react';
import { Link, useLocation } from 'wouter';
import { Compass, LogOut, User, Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLegalModal } from '@/lib/legal-modal-context';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, openTripsModal } = useAuth();
  const { openLegal } = useLegalModal();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <header className="fixed top-0 w-full z-50 px-6 py-5 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80" data-testid="link-home">
            <Compass className="w-6 h-6 text-primary group-hover:rotate-45 transition-transform duration-700 ease-out" />
            <span className="font-serif text-xl tracking-widest uppercase font-medium">VOYAGE</span>
          </Link>
        </div>
        <nav className="pointer-events-auto flex items-center gap-6 text-sm tracking-widest uppercase text-muted-foreground">
          <Link href="/destinations" className="hover:text-primary transition-colors" data-testid="link-destinations">Destinations</Link>
          <Link href="/plan" className="hover:text-primary transition-colors" data-testid="link-plan">Plan a Trip</Link>

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3 border-l border-white/10 pl-6 ml-2">
                  <button
                    onClick={openTripsModal}
                    className="flex items-center gap-1.5 text-muted-foreground/70 hover:text-primary transition-colors text-xs normal-case tracking-normal"
                    title="Мои поездки"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Мои поездки</span>
                  </button>
                  <Link
                    href="/account"
                    className="flex items-center gap-1.5 text-primary/80 hover:text-primary transition-colors text-xs font-medium"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="max-w-[100px] truncate normal-case tracking-normal">{user.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors text-xs"
                    title="Выйти"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="normal-case tracking-normal">Выйти</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 border-l border-white/10 pl-6 ml-2">
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-primary transition-colors text-xs normal-case tracking-normal"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-1.5 border border-primary/40 text-primary rounded-lg text-xs normal-case tracking-normal hover:bg-primary/10 transition-colors"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </header>

      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* Legal footer */}
      <footer className="border-t border-white/5 bg-neutral-950/80 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/30 tracking-wide">© 2025 Voyage AI. Все права защищены.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => openLegal('terms')}
              className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors"
            >
              Пользовательское соглашение
            </button>
            <button
              type="button"
              onClick={() => openLegal('privacy')}
              className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors"
            >
              Политика конфиденциальности
            </button>
            <button
              type="button"
              onClick={() => openLegal('disclaimer')}
              className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors"
            >
              AI Disclaimer
            </button>
            <Link href="/contacts" className="text-xs text-muted-foreground/40 hover:text-primary/70 transition-colors">
              Контакты
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
