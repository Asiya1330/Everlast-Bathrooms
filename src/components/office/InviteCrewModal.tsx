import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';
import { inviteCrewMember } from '../../lib/api';

interface InviteCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteCrewModal: React.FC<InviteCrewModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('installer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await inviteCrewMember({ fullName: fullName.trim(), email: email.trim(), role, phone: phone.trim() });
      setFullName('');
      setEmail('');
      setPhone('');
      setRole('installer');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.log(err);
      setError(err.message || 'Failed to send invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DFE2DE]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0F5CC4]/10 text-[#0F5CC4] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-[#12161A]">Invite Crew Member</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[#6B7A88] leading-relaxed">
            Sends an invitation email with a link to set their password. Their account is created immediately.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Carlos Mendez"
              className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
              Work Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@everlastbathrooms.com"
              className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-medium capitalize"
              >
                <option value="installer">Installer</option>
                <option value="office">Office</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#3A424B] hover:text-[#12161A]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#0F5CC4] hover:bg-[#0E52B0] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending Invite…' : 'Send Invite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
