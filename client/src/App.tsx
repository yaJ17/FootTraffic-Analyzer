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
  const [location] = useLocation();
  
  // Check if path is one of the authenticated routes
  const isAuthPath = (
    location === "/" || 
    location === "/dashboard" || 
    location === "/statistics" || 
    location === "/reports" || 
    location === "/calendar" || 
    location === "/profile"
  );

  return (
    <Switch>
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      {isAuthPath && (
        <Route path={location}>
          <AppLayout>
            {location === "/" && <AuthenticatedRoute component={Dashboard} />}
            {location === "/dashboard" && <AuthenticatedRoute component={Dashboard} />}
            {location === "/statistics" && <AuthenticatedRoute component={Statistics} />}
            {location === "/reports" && <AuthenticatedRoute component={Reports} />}
            {location === "/calendar" && <AuthenticatedRoute component={Calendar} />}
            {location === "/profile" && <AuthenticatedRoute component={Profile} />}
          </AppLayout>
        </Route>
      )}
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
