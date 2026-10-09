import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card/90 p-6 text-center shadow-elevated">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Affichage interrompu</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Une partie de l'application a rencontré un problème, mais l'écran noir a été évité. Rechargez la page ou revenez à l'accueil.
            </p>
            {this.state.errorMessage && (
              <p className="mb-6 rounded-lg border border-border bg-secondary/40 p-3 text-left text-xs text-muted-foreground">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recharger
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")} className="gap-2">
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
