
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AIChatWindow } from "@/components/AIChatWindow";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import AllInsights from "./pages/AllInsights";
import AllDeadlines from "./pages/AllDeadlines";
import ContractDetails from "./pages/ContractDetails";
import EditContract from "./pages/EditContract";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/insights" element={<AllInsights />} />
            <Route path="/deadlines" element={<AllDeadlines />} />
            <Route path="/contracts/:id" element={<ContractDetails />} />
            <Route path="/contracts/:id/edit" element={<EditContract />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatWindow />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
