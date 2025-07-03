import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotionProvider, useNotion } from './contexts/NotionContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Header } from './components/layout/Header';
import { ConnectionView } from './components/views/ConnectionView';
import { DashboardView } from './components/views/DashboardView';
import { ScanView } from './components/views/ScanView';
import { ConfigurationView } from './components/views/ConfigurationView';
import { HistoryView } from './components/views/HistoryView';

const AppContent: React.FC = () => {
  const { isConnected } = useNotion();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isConnected) {
    return <ConnectionView />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'scan':
        return <ScanView />;
      case 'config':
        return <ConfigurationView />;
      case 'history':
        return <HistoryView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProtectedRoute>
            <NotionProvider>
              <AppContent />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </NotionProvider>
          </ProtectedRoute>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;