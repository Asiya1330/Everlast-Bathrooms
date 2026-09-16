import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  Mail,
  Database,
  Plus,
  Search,
  Bell,
  LogOut,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { ServiceCall, UserProfile } from '../../types';
import { db } from '../../lib/database';
import { ServiceCallsTable } from './ServiceCallsTable';
import { CallDetailOffice } from './CallDetailOffice';
import { CreateCallModal } from './CreateCallModal';
import { NotificationsView } from './NotificationsView';
import { Dashboard90d } from './Dashboard90d';
import { SupabaseSetupModal } from './SupabaseSetupModal';
import { CrewManagementView } from './CrewManagementView';

interface OfficePortalProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchUser: (user: UserProfile) => void;
  onToggleSimulator?: () => void;
  isSimulatorOpen?: boolean;
}

type OfficeNavigationTab =
  | 'service_calls'
  | 'dashboard_90d'
  | 'notifications'
  | 'clients'
  | 'team';

export const OfficePortal: React.FC<OfficePortalProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onToggleSimulator,
  isSimulatorOpen,
}) => {
  const [currentTab, setCurrentTab] = useState<OfficeNavigationTab>('service_calls');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calls fetched with RLS enforcement
  const calls = useMemo(() => {
    return db.getServiceCalls(currentUser);
  }, [currentUser, refreshKey]);

  const installers = useMemo(() => {
    return db.getActiveInstallers();
  }, [refreshKey]);

  const notificationLogs = useMemo(() => {
    return db.getNotificationLogs();
  }, [refreshKey]);

  const selectedCall = useMemo(() => {
    if (!selectedCallId) return null;
    return calls.find((c) => c.id === selectedCallId) || null;
  }, [selectedCallId, calls]);

  const handleCreateSuccess = (newCallId: string) => {
    triggerRefresh();
    showToast('Service call created & automatic email dispatched to assigned crew!');
    setSelectedCallId(newCallId);
  };

  const handleUpdateCall = (callId: string, updates: Partial<ServiceCall>) => {
    try {
      db.updateServiceCall(callId, updates, currentUser);
      triggerRefresh();
      showToast('Work order updated');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleAddNote = (callId: string, body: string, visibility: 'shared' | 'internal') => {
    try {
      db.addNote(callId, body, currentUser, visibility);
      triggerRefresh();
      showToast('Note posted');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleAddAttachment = (callId: string, attachment: any) => {
    try {
      db.addAttachment(callId, attachment);
      triggerRefresh();
      showToast('Media uploaded');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const openCallsCount = calls.filter((c) => c.status === 'open' || c.status === 'in_progress').length;

  return (
    <div className="flex h-screen bg-[#FBFBF9] text-[#12161A] overflow-hidden font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-[#12161A] text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Left Sidebar (240px per Spec Section 7.2 & 8: Slate #3A424B sidebar background) */}
      <aside className="w-60 bg-[#12161A] text-white flex flex-col shrink-0 border-r border-[#3A424B]/30 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F5CC4] flex items-center justify-center font-bold text-xs tracking-wider text-white">
              EB
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight">
                EVERLAST
              </span>
              <span className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">
                Service Call Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links Grouped per Spec Section 7.2 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
          {/* Overview Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-1.5">
              Overview
            </span>
            <button
              onClick={() => {
                setCurrentTab('dashboard_90d');
                setSelectedCallId(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'dashboard_90d' && !selectedCallId
                  ? 'bg-[#0F5CC4] text-white font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>90-Day Rate Panel</span>
            </button>
          </div>

          {/* Work Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-1.5">
              Work Orders
            </span>
            <button
              onClick={() => {
                setCurrentTab('service_calls');
                setSelectedCallId(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'service_calls' && !selectedCallId
                  ? 'bg-[#0F5CC4] text-white font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4" />
                <span>Service Calls</span>
              </div>
              {openCallsCount > 0 && (
                <span className="bg-[#0F5CC4]/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {openCallsCount} open
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentTab('notifications');
                setSelectedCallId(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors mt-1 ${
                currentTab === 'notifications' && !selectedCallId
                  ? 'bg-[#0F5CC4] text-white font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" />
                <span>Dispatched Emails</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {notificationLogs.length}
              </span>
            </button>
          </div>

          {/* Administration Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-1.5">
              Crew & Access
            </span>
            <button
              onClick={() => {
                setCurrentTab('team');
                setSelectedCallId(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'team' && !selectedCallId
                  ? 'bg-[#0F5CC4] text-white font-bold'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Crew Accounts</span>
              </div>
              <span className="bg-white/10 text-gray-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {installers.length}
              </span>
            </button>
          </div>

          {/* Database / Supabase */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-1.5">
              Database & Security
            </span>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase / RLS Rules</span>
            </button>
          </div>
        </nav>

        {/* User Card & Logout at bottom */}
        <div className="p-3 border-t border-white/10 bg-black/20 text-xs">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <span className="font-bold block truncate text-white">{currentUser.fullName}</span>
              <span className="text-[10px] text-gray-400 capitalize">
                {currentUser.role} Role
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Fluid capped at 1440px per Spec Section 8) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-[#DFE2DE] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-[#12161A] tracking-tight">
              {selectedCall
                ? `Work Order #${selectedCall.jobNumber}`
                : currentTab === 'service_calls'
                ? 'All Service Calls'
                : currentTab === 'dashboard_90d'
                ? '90-Day Rate Dashboard'
                : 'Dispatched Crew Notifications'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Phone simulator preview toggle */}
            {onToggleSimulator && (
              <button
                onClick={onToggleSimulator}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  isSimulatorOpen
                    ? 'bg-[#0F5CC4] text-white border-[#0F5CC4]'
                    : 'bg-white text-[#3A424B] border-[#DFE2DE] hover:bg-gray-50'
                }`}
                title="Preview what crews see on their mobile phones"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isSimulatorOpen ? 'Hide Phone View' : 'Phone Simulator'}</span>
              </button>
            )}

            {/* Create Call Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0F5CC4] hover:bg-[#0E52B0] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Call</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1440px] mx-auto">
            {selectedCall ? (
              <CallDetailOffice
                call={selectedCall}
                installers={installers}
                currentUser={currentUser}
                onBack={() => setSelectedCallId(null)}
                onUpdateCall={handleUpdateCall}
                onAddNote={handleAddNote}
                onAddAttachment={handleAddAttachment}
              />
            ) : currentTab === 'service_calls' ? (
              <ServiceCallsTable
                calls={calls}
                installers={installers}
                onSelectCall={(call) => setSelectedCallId(call.id)}
                onCreateCall={() => setIsCreateModalOpen(true)}
              />
            ) : currentTab === 'dashboard_90d' ? (
              <Dashboard90d currentUser={currentUser} />
            ) : currentTab === 'team' ? (
              <CrewManagementView
                currentUser={currentUser}
                onSwitchUser={onSwitchUser}
              />
            ) : (
              <NotificationsView logs={notificationLogs} />
            )}
          </div>
        </main>
      </div>

      {/* Create Service Call Modal */}
      <CreateCallModal
        isOpen={isCreateModalOpen}
        currentUser={currentUser}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Supabase Connection & Schema Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
