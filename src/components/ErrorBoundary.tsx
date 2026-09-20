import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#021810] text-emerald-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-emerald-950/90 border-2 border-amber-500/50 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="font-title text-xl font-bold text-amber-300 mb-2">
              Jashn-e-Eid Milad-un-Nabi ﷺ
            </h2>
            <p className="text-xs text-emerald-200/80 mb-4 leading-relaxed">
              We encountered a temporary display issue. Click below to refresh the celebration page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-emerald-950 font-bold rounded-xl text-xs transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Experience</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
