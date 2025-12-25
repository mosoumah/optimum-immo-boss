import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Inscription from "./pages/Inscription";
import Connexion from "./pages/Connexion";
import ProfilEntreprise from "./pages/ProfilEntreprise";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Devis from "./pages/Devis";
import Factures from "./pages/Factures";
import Revenus from "./pages/Revenus";
import Depenses from "./pages/Depenses";
import Taches from "./pages/Taches";
import DocumentsIA from "./pages/DocumentsIA";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route
              path="/profil-entreprise"
              element={
                <ProtectedRoute>
                  <ProfilEntreprise />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devis"
              element={
                <ProtectedRoute>
                  <Devis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute>
                  <Factures />
                </ProtectedRoute>
              }
            />
            <Route
              path="/revenus"
              element={
                <ProtectedRoute>
                  <Revenus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/depenses"
              element={
                <ProtectedRoute>
                  <Depenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/taches"
              element={
                <ProtectedRoute>
                  <Taches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents-ia"
              element={
                <ProtectedRoute>
                  <DocumentsIA />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <ProtectedRoute>
                  <Parametres />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
