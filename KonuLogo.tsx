import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessageDe?: string;
  fallbackMessageEn?: string;
  fallbackNode?: React.ReactNode;
  lang?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error in ButtonDesigner tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackNode) return this.props.fallbackNode;
      const isDe = this.props.lang === 'de';
      const msg = isDe
        ? (this.props.fallbackMessageDe || 'Dieser Bereich konnte nicht geladen werden.')
        : (this.props.fallbackMessageEn || 'This section could not be loaded.');
      return (
        <div className="p-5 bg-red-950/20 border border-red-500/15 rounded-2xl text-center space-y-2.5 my-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 font-bold text-sm">
            !
          </div>
          <p className="text-red-400 font-bold text-xs">{msg}</p>
          <button 
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="text-[10px] text-stone-400 hover:text-white underline font-extrabold tracking-wide uppercase transition cursor-pointer"
          >
            {isDe ? 'Erneut versuchen' : 'Retry'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
