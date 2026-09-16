import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Smartphone,
  Shield,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { db } from '../../lib/database';

interface CrewManagementViewProps {
  currentUser: UserProfile;
  onSwitchUser?: (user: UserProfile) => void;
}

export const CrewManagementView: React.FC<CrewManagementViewProps> = ({
  currentUser,
  onSwitchUser,
}) => {
  const [users, setUsers] = useState<UserProfile[]>(() => db.getUsers());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for adding a new crew member
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('installer');
  const [formError, setFormError] = useState('');

  const refreshList = () => {
    setUsers(db.getUsers());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid email address is required');
      return;
    }

    try {
      const created = db.createCrewMember(
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          role,
        },
        currentUser
      );

      refreshList();
      setIsAddModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('installer');
      showToast(`Crew account created for ${created.fullName}!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create crew member');
    }
  };

  const handleToggleStatus = (userId: string) => {
    try {
      db.toggleCrewActive(userId, currentUser);
      refreshList();
      showToast('Account status updated');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const installersCount = users.filter((u) => u.role === 'installer').length;
  const officeCount = users.filter((u) => u.role === 'admin' || u.role === 'office').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-[#12161A] text-white px-4 py-3 rounded-xl text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#DFE2DE] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0F5CC4]" />
            <h2 className="text-base font-bold text-[#12161A]">Crew & Team Management</h2>
          </div>
          <p className="text-xs text-[#6B7A88] mt-1 max-w-2xl">
            Manage installer crews and office dispatchers. Each crew member has their own secure mobile phone login and receives automatic email notifications when service calls are assigned to them.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#0F5CC4] hover:bg-[#0E52B0] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Crew Member</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DFE2DE] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6B7A88] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search crew by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B7A88]">
          <span>
            <strong>{installersCount}</strong> Installer{installersCount !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>
            <strong>{officeCount}</strong> Admin / Office
          </span>
        </div>
      </div>

      {/* Crew Table */}
      <div className="bg-white rounded-xl border border-[#DFE2DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F0F2F0] text-[#3A424B] border-b border-[#DFE2DE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Active Status</th>
                <th className="py-3 px-4 text-center">Assigned Calls</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE2DE]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const assignedCalls = db
                    .getServiceCalls(currentUser)
                    .filter((c) => c.installerId === user.id);

                  return (
                    <tr key={user.id} className="hover:bg-[#FBFBF9] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#12161A] text-sm">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              user.role === 'admin'
                                ? 'bg-[#12161A] text-white'
                                : user.role === 'office'
                                ? 'bg-blue-800 text-white'
                                : 'bg-emerald-700 text-white'
                            }`}
                          >
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{user.fullName}</div>
                            {user.id === currentUser.id && (
                              <span className="text-[10px] text-[#0F5CC4] font-medium">
                                (Current Session)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'office'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#3A424B]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#6B7A88]" />
                          <span className="font-mono text-xs">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6B7A88]">
                            <Phone className="w-3.5 h-3.5 text-[#6B7A88]" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-xs text-[#12161A]">
                        {user.role === 'installer' ? assignedCalls.length : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === 'installer' && onSwitchUser && (
                            <button
                              onClick={() => onSwitchUser(user)}
                              className="px-2.5 py-1 bg-[#FBFBF9] hover:bg-emerald-50 border border-[#DFE2DE] hover:border-emerald-300 text-emerald-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Preview what this installer sees on their phone"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Test Phone View</span>
                            </button>
                          )}

                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-[#DFE2DE] text-[#3A424B] font-medium rounded-lg text-xs transition-colors"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B7A88]">
                    No crew members found. Click &quot;Add Crew Member&quot; above to onboard an installer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Crew Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DFE2DE] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0F5CC4]" />
                <h3 className="font-bold text-sm text-[#12161A]">Add New Crew Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrew} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#3A424B] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Azua"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3A424B] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="crew@everlastbathrooms.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-medium"
                />
                <p className="text-[11px] text-[#6B7A88] mt-1">
                  Automatic assignment emails will be dispatched to this address.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#3A424B] mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#3A424B] mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-semibold text-[#12161A]"
                >
                  <option value="installer">Installer (Field Crew — Mobile Phone Access)</option>
                  <option value="office">Office Dispatcher (Computer Table Access)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#DFE2DE] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#F0F2F0] hover:bg-[#DFE2DE] text-[#12161A] font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F5CC4] hover:bg-[#0E52B0] text-white font-bold rounded-lg shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
