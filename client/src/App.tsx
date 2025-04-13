import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Statistics from "@/pages/Statistics";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";

function AuthenticatedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  return user ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/">
        <AppLayout>
          <Switch>
            <Route path="/" component={() => <AuthenticatedRoute component={Dashboard} />} />
            <Route path="/dashboard" component={() => <AuthenticatedRoute component={Dashboard} />} />
            <Route path="/statistics" component={() => <AuthenticatedRoute component={Statistics} />} />
            <Route path="/reports" component={() => <AuthenticatedRoute component={Reports} />} />
            <Route path="/calendar" component={() => <AuthenticatedRoute component={Calendar} />} />
            <Route path="/profile" component={() => <AuthenticatedRoute component={Profile} />} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
