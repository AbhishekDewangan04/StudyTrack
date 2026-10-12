import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { GraduationCap } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', or 'register'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B12] text-slate-100 flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-[#111522] p-5 rounded-2xl border border-[#9B6BFF]/30 shadow-2xl">
          <div className="w-6 h-6 border-2 border-[#9B6BFF] border-t-transparent rounded-full animate-spin"></div>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-[#9B6BFF]" />
            <span className="text-xs font-bold text-white tracking-tight">Verifying StudyTrack session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard when user is authenticated
  if (isAuthenticated && user) {
    return <Dashboard />;
  }

  // Render Landing Page or Auth Pages when unauthenticated
  if (authView === 'landing') {
    return (
      <Landing
        onNavigateToLogin={() => setAuthView('login')}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 flex flex-col justify-center">
      {authView === 'login' ? (
        <Login
          onSwitchToRegister={() => setAuthView('register')}
          onGoBackToLanding={() => setAuthView('landing')}
        />
      ) : (
        <Register
          onSwitchToLogin={() => setAuthView('login')}
          onGoBackToLanding={() => setAuthView('landing')}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
