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

function AppRoutes() {
  const { language } = usePlanContext();
  const { user, loading: authLoading } = useAuth();

  // Show nothing while auth is resolving from localStorage
  if (authLoading) return null;

  // Mandatory auth gate — must log in before using the app
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
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/disclaimer" component={Disclaimer} />
        <Route path="/account" component={Account} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
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
  );
}

export default App;
