import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import PathPage from './pages/PathPage';
import ProfilePage from './pages/ProfilePage';
import FamiliarizationModal from './components/FamiliarizationModal';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './hooks/useAuth';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { PerformanceMonitorComponent } from './hooks/usePerformanceTracking';
import { AgentService } from './services/agentService';
import './index.css';

function AppContent() {
  const { theme } = useTheme();
  const { user, loading, needsFamiliarization, refreshUserProfile } = useAuth();
  const [showFamiliarization, setShowFamiliarization] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🟢 Back online - processing offline queue...');
      AgentService.processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('🔴 Gone offline - messages will be queued');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show familiarization modal when user needs it
  useEffect(() => {
    if (!loading && user && needsFamiliarization) {
      // Small delay to ensure smooth transition after login
      const timer = setTimeout(() => {
        setShowFamiliarization(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setShowFamiliarization(false);
    }
  }, [user, loading, needsFamiliarization]);

  const handleFamiliarizationComplete = async () => {
    setShowFamiliarization(false);
    // Refresh user profile to update familiarization status
    await refreshUserProfile();
  };

  // Handle offline queue processing on mount
  useEffect(() => {
    if (isOnline) {
      AgentService.processOfflineQueue();
    }
  }, [isOnline]);
  
  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-500 ${
        theme === 'goldtag' 
          ? 'bg-[#fef7e0]' 
          : 'bg-indigo-900'
      }`}>
        {/* Online/Offline Indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
            You're offline. Messages will be sent when you're back online.
          </div>
        )}

        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/paths" element={<PathPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>

        {/* Familiarization Modal */}
        {user && (
          <FamiliarizationModal
            isOpen={showFamiliarization}
            onClose={() => setShowFamiliarization(false)}
            userId={user.id}
            onFamiliarizationComplete={handleFamiliarizationComplete}
          />
        )}

        {/* Performance Monitor (Development Only) */}
        {import.meta.env.DEV && <PerformanceMonitorComponent />}
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;