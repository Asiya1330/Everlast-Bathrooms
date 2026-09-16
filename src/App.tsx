import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { SEED_USERS, db } from './lib/database';
import { LoginView } from './components/auth/LoginView';
import { InstallerPortal } from './components/installer/InstallerPortal';
import { OfficePortal } from './components/office/OfficePortal';
import { DemoRoleBar } from './components/common/DemoRoleBar';
import { Smartphone, Laptop, ShieldCheck } from 'lucide-react';

const CURRENT_USER_STORAGE_KEY = 'everlast_portal_current_user_id';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (savedId) {
        const found = db.getUsers().find((u) => u.id === savedId);
        if (found) return found;
      }
    }
    // Default to Alan Benzaquen (Admin) so the user immediately sees the desktop interface live!
    return SEED_USERS[0];
  });

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUser.id);
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [currentUser]);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    // If installer logs in, default to phone simulator or phone view
    if (user.role === 'installer') {
      setIsSimulatorOpen(true);
    } else {
      setIsSimulatorOpen(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'installer') {
      setIsSimulatorOpen(true);
    }
  };

  const handleResetData = () => {
    db.resetToDefaults();
    setDbVersion((v) => v + 1);
    setCurrentUser(SEED_USERS[0]);
    setIsSimulatorOpen(false);
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const isInstaller = currentUser.role === 'installer';

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col font-sans">
      {/* Top Demo & Role Switcher Bar */}
      <DemoRoleBar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        isSimulatorOpen={isSimulatorOpen}
        onToggleSimulator={() => setIsSimulatorOpen(!isSimulatorOpen)}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        {isInstaller ? (
          isSimulatorOpen ? (
            /* Mobile Phone Simulator Container (390px width for iPhone 14/15 size) */
            <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 bg-[#232931]/90 overflow-y-auto">
              {/* Simulator info badge */}
              <div className="text-white text-xs mb-3 flex items-center gap-2 font-medium bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                <Smartphone className="w-3.5 h-3.5 text-[#0F5CC4]" />
                <span>Field Crew Phone View • {currentUser.fullName}</span>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => setIsSimulatorOpen(false)}
                  className="text-blue-400 hover:underline"
                >
                  Switch to Full Screen
                </button>
              </div>

              {/* iPhone Bezel Frame */}
              <div className="relative w-full max-w-[400px] h-[830px] max-h-[90vh] bg-black rounded-[44px] p-3 shadow-2xl border-[6px] border-[#3A424B] flex flex-col overflow-hidden">
                {/* iPhone Dynamic Island / Speaker cutout */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-end px-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] border border-gray-800"></div>
                </div>

                {/* Inner Screen */}
                <div className="relative flex-1 bg-[#FBFBF9] rounded-[34px] overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <InstallerPortal
                      key={`${currentUser.id}-${dbVersion}`}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                      onSwitchUser={handleSwitchUser}
                    />
                  </div>
                </div>

                {/* iPhone Home Indicator Bar */}
                <div className="h-4 flex items-center justify-center pt-1">
                  <div className="w-32 h-1 bg-white/40 rounded-full"></div>
                </div>
              </div>
            </div>
          ) : (
            /* Full-screen mobile view */
            <div className="flex-1 bg-[#FBFBF9]">
              <InstallerPortal
                key={`${currentUser.id}-${dbVersion}`}
                currentUser={currentUser}
                onLogout={handleLogout}
                onSwitchUser={handleSwitchUser}
              />
            </div>
          )
        ) : (
          /* Office & Admin Desktop View */
          <div className="flex-1 flex flex-col min-h-0">
            <OfficePortal
              key={`${currentUser.id}-${dbVersion}`}
              currentUser={currentUser}
              onLogout={handleLogout}
              onSwitchUser={handleSwitchUser}
              onToggleSimulator={() => {
                // Switch to Alexander Azua (Installer) in Phone Simulator
                const installerUser = SEED_USERS.find((u) => u.role === 'installer');
                if (installerUser) {
                  setCurrentUser(installerUser);
                  setIsSimulatorOpen(true);
                }
              }}
              isSimulatorOpen={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
