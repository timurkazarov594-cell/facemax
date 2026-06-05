import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Plan from "@/pages/Plan";
import Paywall from "@/pages/Paywall";
import Loading from "@/pages/Loading";
import Results from "@/pages/Results";
import Destinations from "@/pages/Destinations";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Contacts from "@/pages/Contacts";
import Disclaimer from "@/pages/Disclaimer";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailed from "@/pages/PaymentFailed";
import Demo from "@/pages/Demo";
import { PlanProvider, usePlanContext } from "@/lib/plan-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { MyTripsModal } from "@/components/MyTripsModal";
import { LanguagePicker } from "@/components/LanguagePicker";
import { AuthGate } from "@/components/AuthGate";
import { SupportButton } from "@/components/SupportButton";
import { LegalModalProvider } from "@/lib/legal-modal-context";
import { initDevModeFromUrl } from "@/lib/dev-bypass";

initDevModeFromUrl();

const queryClient = new QueryClient();

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Error Boundary ────────────────────────────────────────────────────────────
interface EBState { hasError: boolean }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-neutral-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-4xl font-serif text-primary tracking-widest">VOYAGE</p>
          <p className="text-white/60 text-sm max-w-xs">
            Не удалось загрузить данные. Попробуйте обновить страницу.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-3 bg-primary text-black text-sm font-medium uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors"
          >
            Обновить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex flex-col items-center justify-center gap-4">
      <p className="text-2xl font-serif text-primary tracking-widest">VOYAGE</p>
      <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { language } = usePlanContext();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <AuthLoadingScreen />;

  if (!user) {
    return <AuthGate />;
  }

  if (!language) {
    return <LanguagePicker />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plan" component={Plan} />
      <Route path="/paywall" component={Paywall} />
      <Route path="/loading" component={Loading} />
      <Route path="/results" component={Results} />
      <Route path="/destinations" component={Destinations} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <WouterRouter base={BASE}>
      <Switch>
        {/* Public pages — always accessible, never behind the language gate */}
        <Route path="/demo" component={Demo} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/account" component={Account} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-failed" component={PaymentFailed} />
        {/* Everything else goes through the language selection gate */}
        <Route>
          <AppRoutes />
        </Route>
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <PlanProvider>
              <LegalModalProvider>
                <Router />
                <AuthModal />
                <MyTripsModal />
                <SupportButton />
              </LegalModalProvider>
            </PlanProvider>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
