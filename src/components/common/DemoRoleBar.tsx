import React from 'react';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Users,
  RotateCcw,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { db } from '../../lib/database';

interface DemoRoleBarProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  isSimulatorOpen: boolean;
  onToggleSimulator: () => void;
  onResetData: () => void;
  onLogout: () => void;
}

export const DemoRoleBar: React.FC<DemoRoleBarProps> = ({
  currentUser,
  onSwitchUser,
  isSimulatorOpen,
  onToggleSimulator,
  onResetData,
  onLogout,
}) => {
  const allUsers = db.getUsers();

  return (
    <div className="bg-[#12161A] text-white px-4 py-2 border-b border-white/10 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
      {/* Left: Role Indicator & Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Database RLS Active:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Viewing as:</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = allUsers.find((u) => u.id === e.target.value);
              if (selected) onSwitchUser(selected);
            }}
            className="bg-[#232931] text-white border border-white/20 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#0F5CC4]"
          >
            {allUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.role === 'installer' ? 'Phone Crew' : 'Office ' + user.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Simulator toggle, Reset data, Logout */}
      <div className="flex items-center gap-2.5 ml-auto">
        {currentUser.role === 'installer' && (
          <button
            onClick={onToggleSimulator}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              isSimulatorOpen
                ? 'bg-[#0F5CC4] text-white'
                : 'bg-[#232931] text-gray-300 hover:text-white'
            }`}
            title="Toggle phone container frame"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isSimulatorOpen ? 'Phone Frame' : 'Full Screen'}</span>
          </button>
        )}

        <button
          onClick={() => {
            if (confirm('Reset database to initial demo state (Alan, Alexander, Carlos, Shirley Godin calls)?')) {
              onResetData();
            }
          }}
          className="px-2.5 py-1 text-gray-400 hover:text-white bg-[#232931] hover:bg-white/10 rounded-lg flex items-center gap-1 transition-colors"
          title="Reset database to default seed state"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset Seed</span>
        </button>

        <button
          onClick={onLogout}
          className="px-2.5 py-1 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 rounded-lg flex items-center gap-1 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3 h-3" />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
};
