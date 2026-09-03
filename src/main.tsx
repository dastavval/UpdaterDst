import { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('main.tsx executing after imports');

// Mark React app mounted flag for in-browser diagnostic
(window as any).__REACT_APP_MOUNTED__ = true;

// Prevent transient WebSocket connection closed rejections from showing error overlays in preview
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message?.includes('WebSocket') ||
     event.reason.toString?.().includes('WebSocket') ||
     String(event.reason).includes('WebSocket') ||
     String(event.reason).includes('closed without being opened'))
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const msg = args.map(a => String(a)).join(' ');
  if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('closed without') || msg.includes('failed to connect')) {
    return;
  }
  originalConsoleError(...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = args.map(a => String(a)).join(' ');
  if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('closed without')) {
    return;
  }
  originalConsoleWarn(...args);
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Auto recovery for chunk / dynamic import load errors when deployment updates
    const isChunkError = error && (
      error.name === "ChunkLoadError" ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("loading chunk")
    );

    if (isChunkError) {
      const pageHasBeenReloaded = sessionStorage.getItem("chunk_reload_boundary_attempted");
      if (!pageHasBeenReloaded) {
        sessionStorage.setItem("chunk_reload_boundary_attempted", "true");
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          direction: 'rtl',
          textAlign: 'right',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '750px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px' }}>🚨</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fca5a5' }}>
                  خطای رندرینگ برنامه‌ کاربردی (React Error Boundary)
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  برنامه با یک استثنای غیرمنتظره مواجه شد اما به لطف سامانه ایمنی متوقف گردید.
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#f87171',
              direction: 'ltr',
              textAlign: 'left',
              maxHeight: '250px',
              overflowY: 'auto',
              marginBottom: '20px',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 تلاش مجدد (صفحه اصلی)
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🧹 بازنشانی تنظیمات و پاکسازی داده‌ها
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);


