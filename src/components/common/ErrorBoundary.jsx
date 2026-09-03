import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h3 className="text-base font-bold text-amber-900">Unable to load this section</h3>
          <p className="mt-1 text-xs text-amber-700">
            A temporary display error occurred. Please refresh or try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
