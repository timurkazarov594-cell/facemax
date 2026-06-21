import { Component, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Mic } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Session from "./pages/Session";
import SessionSummary from "./pages/SessionSummary";
import Vocabulary from "./pages/Vocabulary";
import Achievements from "./pages/Achievements";
import Analytics from "./pages/Analytics";
import PaymentReturn from "./pages/PaymentReturn";
import Offer from "./pages/Offer";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ── Error boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean; message: string }

class ErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: unknown): EBState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-destructive/50 rounded-2xl p-8 space-y-4">
            <h2 className="text-lg font-semibold text-destructive">Что-то пошло не так</h2>
            <p className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded-lg break-all">
              {this.state.message || "Неизвестная ошибка"}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, message: "" }); window.location.href = import.meta.env.BASE_URL; }}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Mic className="w-8 h-8" />
        <span className="text-2xl font-bold tracking-tight">SpeakTutor</span>
      </div>
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Protected route ───────────────────────────────────────────────────────────

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoadingScreen />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

// Stable component refs — inline arrow functions in `component` prop remount on every render
const DashboardPage      = () => <ProtectedRoute component={Dashboard} />;
const PracticePage       = () => <ProtectedRoute component={Practice} />;
const SessionPage        = () => <ProtectedRoute component={Session} />;
const SessionSummaryPage = () => <ProtectedRoute component={SessionSummary} />;
const VocabularyPage     = () => <ProtectedRoute component={Vocabulary} />;
const AchievementsPage   = () => <ProtectedRoute component={Achievements} />;
const AnalyticsPage      = () => <ProtectedRoute component={Analytics} />;
const PaymentReturnPage  = () => <ProtectedRoute component={PaymentReturn} />;

// ── Router ────────────────────────────────────────────────────────────────────

function Router() {
  return (
    <Switch>
      <Route path="/"                      component={Landing} />
      <Route path="/login"                 component={Login} />
      <Route path="/register"              component={Register} />
      <Route path="/dashboard"             component={DashboardPage} />
      <Route path="/practice"              component={PracticePage} />
      <Route path="/session/:id/summary"   component={SessionSummaryPage} />
      <Route path="/session/:id"           component={SessionPage} />
      <Route path="/vocabulary"            component={VocabularyPage} />
      <Route path="/achievements"          component={AchievementsPage} />
      <Route path="/analytics"             component={AnalyticsPage} />
      <Route path="/payment/return"        component={PaymentReturnPage} />
      <Route path="/offer"                 component={Offer} />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  // Strip trailing slash so wouter base works correctly:
  // "/speaktutor/" → "/speaktutor" (Replit)
  // "/"           → ""            (Render / standalone)
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={base}>
              <Router />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
