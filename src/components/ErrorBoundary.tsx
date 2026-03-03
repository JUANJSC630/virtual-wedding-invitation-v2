import React from "react";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ─── SectionErrorBoundary ─────────────────────────────────────────────────────
// Wraps individual invitation sections. On error: silently renders nothing.

interface SectionState { hasError: boolean }

export class SectionErrorBoundary extends React.Component<
  React.PropsWithChildren,
  SectionState
> {
  state: SectionState = { hasError: false };

  static getDerivedStateFromError(): SectionState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SectionErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── PanelErrorBoundary ───────────────────────────────────────────────────────
// Wraps admin / master panels. On error: shows a friendly card with reload button.

interface PanelState { hasError: boolean; message: string }

export class PanelErrorBoundary extends React.Component<
  React.PropsWithChildren,
  PanelState
> {
  state: PanelState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): PanelState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[PanelErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold text-lg">Algo salió mal</h2>
                <p className="text-sm text-muted-foreground">
                  Ocurrió un error inesperado. Recarga la página para continuar.
                </p>
                {this.state.message && (
                  <p className="text-xs text-muted-foreground font-mono mt-2 bg-muted px-2 py-1 rounded">
                    {this.state.message}
                  </p>
                )}
              </div>
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recargar página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
