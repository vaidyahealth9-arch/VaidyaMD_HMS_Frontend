'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Clinical UI Exception Caught]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Application Error Encountered</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              An unexpected UI exception occurred while rendering this clinical module. Your patient and treatment cycle records in the database remain safe.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-left">
                <p className="font-mono text-[11px] text-rose-700 font-semibold truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-[rgb(var(--clr-primary))] hover:opacity-90 text-white font-semibold text-xs rounded-md transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Module</span>
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
