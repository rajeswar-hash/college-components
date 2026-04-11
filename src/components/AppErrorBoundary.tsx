import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { trackHandledError } from "@/lib/errorTracking";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackHandledError("react.error-boundary", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto flex min-h-screen max-w-xl items-center px-4 py-16">
            <div className="w-full rounded-[28px] border border-border/70 bg-card p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">CampusKart</p>
              <h1 className="mt-3 text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We logged the issue automatically. Please reload the page and try again.
              </p>
              <Button onClick={this.handleReload} className="mt-5 h-11 rounded-xl">
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
