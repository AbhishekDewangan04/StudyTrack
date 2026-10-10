import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Mail, Lock, Eye, EyeOff, GraduationCap, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';

const Login = ({ onSwitchToRegister, onGoBackToLanding }) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage('');
    try {
      const data = await authAPI.getGoogleAuthUrl();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to retrieve Google authentication URL');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google Auth is currently unavailable');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrorMessage('Please provide both email and password');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#090B12] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#9B6BFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#FFBF69]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-[#111522]/90 border border-[#191B2B] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">

        {/* Left Side Artwork / Branding (Reference Image Section 2 aesthetic) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-[#191B2B] to-[#090B12] p-8 flex-col justify-between border-r border-[#191B2B] relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            {onGoBackToLanding && (
              <button
                onClick={onGoBackToLanding}
                className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>
            )}

            <div className="w-12 h-12 rounded-2xl bg-[#9B6BFF] flex items-center justify-center text-white shadow-lg shadow-[#9B6BFF]/30">
              <GraduationCap className="w-7 h-7" />
            </div>

            <h1 className="text-3xl font-black text-white font-display leading-tight">
              Welcome <br />
              <span className="gradient-text-purple">Back</span>
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continue your study journey. Discipline today, brighter tomorrows.
            </p>
          </div>

          {/* Inspirational Quote Card */}
          <div className="relative z-10 p-4 rounded-2xl bg-[#111522]/80 border border-[#9B6BFF]/20 space-y-2">
            <div className="flex items-center space-x-1.5 text-[#FFBF69]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Daily Inspiration</span>
            </div>
            <p className="text-xs text-slate-300 italic font-serif-accent">
              "Consistency is what transforms average into excellence."
            </p>
          </div>
        </div>

        {/* Right Side Form (Login) */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-6 flex flex-col justify-center">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl font-black text-white tracking-tight font-display">Sign In</h2>
            <p className="text-xs text-slate-400">Enter your credentials to access your StudyTrack dashboard</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#191B2B] hover:bg-[#191B2B]/80 border border-[#9B6BFF]/20 hover:border-[#9B6BFF]/40 rounded-2xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-[#191B2B] w-full" />
            <span className="bg-[#111522] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest absolute">
              or email
            </span>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@student.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#090B12] focus:bg-[#090B12] border border-[#191B2B] focus:border-[#9B6BFF] rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link will be sent to your email.'); }} className="text-[11px] font-semibold text-[#C4A7FF] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#090B12] focus:bg-[#090B12] border border-[#191B2B] focus:border-[#9B6BFF] rounded-2xl text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={submitting}
              className="w-full gradient-btn-purple py-3 rounded-2xl font-bold text-xs cursor-pointer shadow-lg shadow-[#9B6BFF]/20 mt-2"
            >
              Sign In →
            </Button>
          </form>

          {/* Switch to Register link */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#C4A7FF] font-bold hover:underline focus:outline-none cursor-pointer"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
