import { Switch, Route, useLocation, Redirect } from "wouter";
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
import VideoAnalysis from "@/pages/VideoAnalysis";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import './App.css';

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
  const [location] = useLocation();
  const { user, loading } = useAuth();
  
  // Check if path is one of the authenticated routes
  const isAuthPath = (
    location === "/" || 
    location === "/dashboard" || 
    location === "/statistics" || 
    location === "/reports" || 
    location === "/calendar" || 
    location === "/profile" ||
    location === "/video-analysis"
  );
  
  // Handle root path redirection
  if (location === "/" && user && !loading) {
    return <Redirect to="/dashboard" />;
  }
  
  // Handle authentication redirection for login/signup pages
  if ((location === "/signin" || location === "/signup") && user && !loading) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/dashboard">
        <AppLayout>
          <AuthenticatedRoute component={Dashboard} />
        </AppLayout>
      </Route>
      <Route path="/statistics">
        <AppLayout>
          <AuthenticatedRoute component={Statistics} />
        </AppLayout>
      </Route>
      <Route path="/reports">
        <AppLayout>
          <AuthenticatedRoute component={Reports} />
        </AppLayout>
      </Route>
      <Route path="/calendar">
        <AppLayout>
          <AuthenticatedRoute component={Calendar} />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <AuthenticatedRoute component={Profile} />
        </AppLayout>
      </Route>
      <Route path="/video-analysis">
        <AppLayout>
          <AuthenticatedRoute component={VideoAnalysis} />
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
