import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import Index from "./pages/Index";
import Inscription from "./pages/Inscription";
import Connexion from "./pages/Connexion";
import ProfilEntreprise from "./pages/ProfilEntreprise";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Biens from "./pages/Biens";
import BienDetail from "./pages/BienDetail";
import Reservations from "./pages/Reservations";

import Factures from "./pages/Factures";
import Revenus from "./pages/Revenus";
import Depenses from "./pages/Depenses";
import Taches from "./pages/Taches";


import Parametres from "./pages/Parametres";
import Utilisateurs from "./pages/Utilisateurs";
import GestionPermissions from "./pages/GestionPermissions";

import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary name="AppRoot">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route
              path="/profil-entreprise"
              element={
                <ProtectedRoute>
                  <ProfilEntreprise />
                </ProtectedRoute>
              }
            />
            {/* Admin & Agent routes */}
            <Route
              path="/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <Dashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <Clients />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <ClientDetail />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/biens"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <Biens />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/biens/:id"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <BienDetail />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <Reservations />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <Factures />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/taches"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "agent"]}>
                  <Taches />
                </RoleProtectedRoute>
              }
            />
            {/* Admin only routes */}
            <Route
              path="/revenus"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Revenus />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/depenses"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Depenses />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Parametres />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/utilisateurs"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <Utilisateurs />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/gestion-permissions"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <GestionPermissions />
                </RoleProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
