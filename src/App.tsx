import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { supabase } from './lib/supabase';
import { getCurrentProfile, signOut } from './lib/api';
import { LoginView } from './components/auth/LoginView';
import { InstallerPortal } from './components/installer/InstallerPortal';
import { OfficePortal } from './components/office/OfficePortal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentProfile()
      .then(setCurrentUser)
      .finally(() => setIsLoading(false));

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setCurrentUser(null);
        return;
      }
      const profile = await getCurrentProfile();
      setCurrentUser(profile);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center">
        <span className="text-sm text-[#6B7A88]">Loading…</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] flex flex-col font-sans">
      {currentUser.role === 'installer' ? (
        <InstallerPortal currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <OfficePortal currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
