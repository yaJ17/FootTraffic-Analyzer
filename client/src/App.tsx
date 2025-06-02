import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import { FootTrafficProvider } from "./context/FootTrafficContext";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Statistics from "@/pages/Statistics";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Profile from "@/pages/Profile";
import VideoAnalysis from "@/pages/VideoAnalysis";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import './App.css';

// Direct access component (no auth required)
function DirectAccessRoute({ component: Component }: { component: React.ComponentType }) {
  return <Component />;
}

// Original authenticated route (keeping for reference)
function AuthenticatedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading, pendingVerification } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If no user at all, redirect to sign in
        setLocation("/signin");
      } else if (pendingVerification) {
        // If user exists but verification is pending, stay on signin page 
        // the signin page will show verification UI
        setLocation("/signin");
      }
    }
  }, [user, loading, pendingVerification, setLocation]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return user && !pendingVerification ? <Component /> : null;
}

function Router() {
  const [location] = useLocation();
  const { user, loading, pendingVerification } = useAuth();
  
  // Handle loading state
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/dashboard">
        <AppLayout>
          <DirectAccessRoute component={Dashboard} />
        </AppLayout>
      </Route>
      <Route path="/statistics">
        <AppLayout>
          <DirectAccessRoute component={Statistics} />
        </AppLayout>
      </Route>
      <Route path="/reports">
        <AppLayout>
          <DirectAccessRoute component={Reports} />
        </AppLayout>
      </Route>
      <Route path="/calendar">
        <AppLayout>
          <DirectAccessRoute component={Calendar} />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <DirectAccessRoute component={Profile} />
        </AppLayout>
      </Route>
      <Route path="/video-analysis">
        <AppLayout>
          <DirectAccessRoute component={VideoAnalysis} />
        </AppLayout>
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FootTrafficProvider>
          <Router />
          <Toaster />
        </FootTrafficProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
