import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Laptop,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { db } from '../../lib/database';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const users = db.getUsers();

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      setError('No account found with this email. Use the Admin account or sign in below.');
      return;
    }
    if (!user.isActive) {
      setError('This account has been deactivated. Please contact the administrator.');
      return;
    }
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex w-14 h-14 rounded-2xl bg-[#12161A] text-white items-center justify-center font-bold text-xl mb-3 shadow-md">
          EB
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#12161A]">
          EVERLAST BATHROOMS
        </h1>
        <p className="mt-1 text-sm text-[#6B7A88]">
          Service Call Dispatch & Field Crew Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 space-y-6">
        {/* Login Box */}
        <div className="bg-white py-8 px-6 shadow-xl border border-[#DFE2DE] rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleStandardLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7A88] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@everlastbathrooms.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-xl focus:border-[#0F5CC4] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6B7A88] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-xl focus:border-[#0F5CC4] outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0F5CC4] hover:bg-[#0E52B0] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Sign In to Service Portal
            </button>
          </form>

          {/* Quick Sign-In Options */}
          <div className="mt-8 pt-6 border-t border-[#DFE2DE]">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#12161A] mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F5CC4]" />
                <span>Available Accounts</span>
              </div>
              <span className="text-[10px] text-[#6B7A88] font-normal normal-case">
                {users.length} {users.length === 1 ? 'account' : 'accounts'} registered
              </span>
            </div>
            <p className="text-xs text-[#6B7A88] mb-4 leading-relaxed">
              Select an account below to sign in directly:
            </p>

            <div className="space-y-2.5">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isInstaller = u.role === 'installer';

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onLogin(u)}
                    className={`w-full p-3 text-left rounded-xl border transition-all flex items-center justify-between group ${
                      isAdmin
                        ? 'border-[#DFE2DE] hover:border-[#0F5CC4] hover:bg-blue-50/40'
                        : isInstaller
                        ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50'
                        : 'border-[#DFE2DE] hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                          isAdmin
                            ? 'bg-[#12161A]'
                            : isInstaller
                            ? 'bg-emerald-700'
                            : 'bg-indigo-700'
                        }`}
                      >
                        {isAdmin ? (
                          <Laptop className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#12161A] flex items-center gap-2">
                          <span>{u.fullName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                              isAdmin
                                ? 'bg-blue-100 text-[#0F5CC4]'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7A88]">
                          {u.email} • {isAdmin ? 'Full dispatch dashboard & crew management' : 'Mobile phone field view (RLS protected)'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0F5CC4] group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}

              {users.filter((u) => u.role === 'installer').length === 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">No crew accounts created yet</span>
                    Log in as Admin to access the dashboard and use the &quot;Crew Accounts&quot; tab to invite your field crew.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Database RLS Isolation Note */}
        <div className="p-4 bg-[#F0F2F0] rounded-xl border border-[#DFE2DE] text-xs text-[#3A424B] space-y-1">
          <span className="font-bold block text-[#12161A]">
            Milestone 1 Database Row Level Security (RLS):
          </span>
          <p className="leading-relaxed">
            Database-enforced isolation ensures field crews only query and view service calls assigned to their user ID, while the Admin has full oversight and can create crew accounts.
          </p>
        </div>
      </div>
    </div>
  );
};
