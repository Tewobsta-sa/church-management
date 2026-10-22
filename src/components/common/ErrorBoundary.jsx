import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              ያልተጠበቀ ችግር አጋጥሟል
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              Something went wrong in the application.
            </p>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              እባክዎ ገጹን እንደገና ያስጀምሩት ወይም ወደ ዋናው ገጽ ይመለሱ። ችግሩ ከቀጠለ የስርዓት አስተዳዳሪውን ያነጋግሩ።
              <br />
              <span className="text-xs text-gray-400">
                Please refresh the page or return home. Contact your administrator if the issue persists.
              </span>
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg text-left overflow-auto max-h-36 text-xs font-mono text-red-700 dark:text-red-300">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                እንደገና ጫን (Reload)
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                ዋና ገጽ (Home)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
