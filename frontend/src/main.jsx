import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // FIX: EMERGENCY RESET FUNCTION
  handleReset = () => {
    localStorage.clear(); // Clear bad data
    window.location.reload(); // Restart app
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, textAlign: 'center', marginTop: '40%', fontFamily: 'sans-serif' }}>
          <h1 style={{color: '#ef4444'}}>⚠️ App Crash</h1>
          <p style={{color: '#64748b'}}>Critical system failure detected.</p>
          
          <div style={{background: '#f1f5f9', padding: 10, margin: '20px 0', borderRadius: 8, fontSize: 10, textAlign: 'left', color: 'red'}}>
            {this.state.error?.toString() || "Unknown Error"}
          </div>

          <button 
            onClick={this.handleReset}
            style={{ 
              background: '#2563eb', color: 'white', padding: '12px 24px', 
              border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16 
            }}
          >
            🔄 Factory Reset & Restart
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);