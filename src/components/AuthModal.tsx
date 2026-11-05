import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuditorRole } from '../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('santhu246kumar@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('Security Lead');
  const [role, setRole] = useState<AuditorRole>('Lead Security Architect');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    login(email, name, role);
    onClose();
  };

  const handleQuickDemoLogin = (demoRole: AuditorRole, demoEmail: string, demoName: string) => {
    login(demoEmail, demoName, demoRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isRegister ? 'Create Security Auditor Account' : 'Auditor Sign In'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Access project code audits and encrypted scan history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
              !isRegister
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors border-b-2 ${
              isRegister
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Profile
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Auditor Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Security Credential / Passkey</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Security Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AuditorRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="Lead Security Architect">Lead Security Architect</option>
                <option value="DevSecOps Engineer">DevSecOps Engineer</option>
                <option value="Application Security Auditor">Application Security Auditor</option>
                <option value="Software Engineer">Software Engineer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-950 transition-colors flex items-center justify-center space-x-2 mt-2"
          >
            <span>{isRegister ? 'Create Profile & Sign In' : 'Sign In as Security Auditor'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Auditor One-Click Logins */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
              Quick One-Click Sign-In:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Lead Security Architect', 'santhu246kumar@gmail.com', 'Santhu Kumar')}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-cyan-700/60 rounded text-left transition-colors"
              >
                <div className="font-semibold text-cyan-400 truncate">Santhu Kumar</div>
                <div className="text-[10px] text-slate-500 truncate">Lead Architect</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('DevSecOps Engineer', 'devsecops@sentinel.internal', 'Alex Rivera')}
                className="p-2 bg-slate-950 border border-slate-800 hover:border-cyan-700/60 rounded text-left transition-colors"
              >
                <div className="font-semibold text-emerald-400 truncate">Alex Rivera</div>
                <div className="text-[10px] text-slate-500 truncate">DevSecOps Lead</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
