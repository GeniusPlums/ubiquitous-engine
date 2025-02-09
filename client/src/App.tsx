import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/layout/navbar";
import Dashboard from "@/pages/dashboard";
import Builder from "@/pages/builder";
import Campaigns from "@/pages/campaigns";
import Templates from "@/pages/templates";
import Analytics from "@/pages/analytics";
import Segments from "@/pages/segments";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/builder" component={Builder} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/templates" component={Templates} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/segments" component={Segments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;