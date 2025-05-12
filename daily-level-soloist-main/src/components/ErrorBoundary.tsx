import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8 border-red-500 bg-solo-dark/90">
          <CardHeader>
            <CardTitle className="text-red-500">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">The application encountered an error.</p>
            {this.state.error && (
              <div className="bg-red-500/10 p-4 rounded-md border border-red-500/30 mb-4">
                <p className="font-mono text-xs text-red-400 whitespace-pre-wrap overflow-auto">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={this.reset} variant="outline">
              Try again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 