import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI CRASH PREVENTED:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 m-4">
          <AlertTriangle className="text-red-500 mb-3" size={40} />
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">UI Component Crashed</h2>
          <p className="text-xs text-red-500/80 mb-4 text-center">Lekin app background mein chal raha hai.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
          >
            <RefreshCw size={16} /> Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}