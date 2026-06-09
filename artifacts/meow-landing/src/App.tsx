import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import CreateEvent from "@/pages/CreateEvent";
import EventDetails from "@/pages/EventDetails";
import ManageEvent from "@/pages/ManageEvent";
import Explore from "@/pages/Explore";
import QRScanner from "@/pages/QRScanner";
import Ticket from "@/pages/Ticket";
import Settings from "@/pages/Settings";
import Onboarding from "@/pages/Onboarding";
import HostProfile from "@/pages/HostProfile";
import Register from "@/pages/Register";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Apply global theme from local storage
if (typeof window !== 'undefined') {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function ProtectedRoute({ component: Component, path }: { component: any, path: string }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-4xl">MEOW...</div>;
  if (!user) return null;

  return <Route path={path} component={Component} />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {user ? <Dashboard /> : <Home />}
      </Route>
      <Route path="/welcome" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <Route path="/explore" component={Explore} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/create-event" component={CreateEvent} />
      <ProtectedRoute path="/edit-event/:id" component={CreateEvent} />
      <ProtectedRoute path="/manage/:id" component={ManageEvent} />
      <ProtectedRoute path="/scan/:id" component={QRScanner} />
      <Route path="/e/:id" component={EventDetails} />
      <Route path="/register/:id" component={Register} />
      <Route path="/ticket/:eventId/:rsvpId" component={Ticket} />
      <Route path="/p/:username" component={HostProfile} />


      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

