import React, { useState } from 'react';
import {
  X,
  Plus,
  Upload,
  Camera,
  Film,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Mail,
  UserCheck,
} from 'lucide-react';
import {
  Attachment,
  BillingType,
  CallPriority,
  Client,
  Responsibility,
  UserProfile,
} from '../../types';
import { db } from '../../lib/database';
import { formatBytes } from '../../lib/utils';

interface CreateCallModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: (newCallId: string) => void;
}

export const CreateCallModal: React.FC<CreateCallModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const clients = db.getClients();
  const installers = db.getActiveInstallers();

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isCreatingClient, setIsCreatingClient] = useState(clients.length === 0);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [jobNumber, setJobNumber] = useState('');
  const [installerId, setInstallerId] = useState<string>(installers[0]?.id || '');
  const [reportedDate, setReportedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [installDate, setInstallDate] = useState<string>('');
  const [priority, setPriority] = useState<CallPriority>('mid');
  const [responsibility, setResponsibility] = useState<Responsibility>('installer');
  const [billing, setBilling] = useState<BillingType>('unpaid');
  const [description, setDescription] = useState('');

  // Media files state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: Attachment[] = [];
    Array.from(files).forEach((file: File) => {
      // 100 MB spec limit check
      if (file.size > 104857600) {
        alert(`File ${file.name} exceeds the 100 MB limit.`);
        return;
      }

      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      newFiles.push({
        id: 'att_' + Math.random().toString(36).substring(2, 9),
        serviceCallId: '',
        storagePath: `pending/reported/${file.name}`,
        fileName: file.name,
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        sizeBytes: file.size,
        kind: isVideo ? 'video' : 'image',
        phase: 'reported',
        uploadedBy: currentUser.id,
        uploaderName: currentUser.fullName,
        createdAt: new Date().toISOString(),
        url,
      });
    });

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateNewClient = () => {
    if (!newClientName.trim()) return;
    const client = db.createClient({
      name: newClientName.trim(),
      phone: newClientPhone.trim() || undefined,
      address: newClientAddress.trim() || undefined,
    });
    setSelectedClientId(client.id);
    setIsCreatingClient(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewClientAddress('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobNumber.trim()) {
      setErrorMessage('Job number is required.');
      return;
    }

    let finalClientId = selectedClientId;
    if (isCreatingClient && newClientName.trim()) {
      const client = db.createClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
        address: newClientAddress.trim() || undefined,
      });
      finalClientId = client.id;
      setSelectedClientId(client.id);
    }

    if (!finalClientId) {
      setErrorMessage('Please provide or select a client name.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Issue description is required.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const createdCall = await db.createServiceCall(
        {
          jobNumber: jobNumber.trim(),
          clientId: finalClientId,
          installerId: installerId || null,
          reportedDate,
          installDate: installDate || null,
          priority,
          responsibility,
          billing,
          description: description.trim(),
          attachments,
        },
        currentUser
      );

      setIsSubmitting(false);
      onSuccess(createdCall.id);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to create service call');
    }
  };

  const selectedInstaller = installers.find((i) => i.id === installerId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DFE2DE] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
          <div>
            <h2 className="text-lg font-bold text-[#12161A]">Create New Service Call</h2>
            <p className="text-xs text-[#3A424B]">
              Logged from office computer • Assigns crew and dispatches automatic email notification
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body - Two Columns on desktop per Spec Section 7.3 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Call Information */}
            <div className="md:col-span-7 space-y-4">
              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B]">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingClient(!isCreatingClient)}
                    className="text-xs text-[#0F5CC4] font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreatingClient ? 'Select existing' : 'Create new client'}</span>
                  </button>
                </div>

                {isCreatingClient ? (
                  <div className="p-3 bg-[#FBFBF9] rounded-xl border border-[#DFE2DE] space-y-2.5">
                    <input
                      type="text"
                      placeholder="Client Full Name (e.g. Jason Kole (Phase 1))"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Phone (e.g. 555-412-8832)"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="text-xs p-2 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Address (e.g. Newton, MA)"
                        value={newClientAddress}
                        onChange={(e) => setNewClientAddress(e.target.value)}
                        className="text-xs p-2 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNewClient}
                      disabled={!newClientName.trim()}
                      className="px-3 py-1.5 bg-[#12161A] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    >
                      Save Client
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-medium"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} {c.address ? `• ${c.address}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Job Number & Dates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                    Job # <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1537"
                    value={jobNumber}
                    onChange={(e) => setJobNumber(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-mono font-bold tabular-nums"
                  />
                  <span className="text-[10px] text-[#6B7A88] mt-0.5 block">
                    Non-unique ref #
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                    Reported Date
                  </label>
                  <input
                    type="date"
                    required
                    value={reportedDate}
                    onChange={(e) => setReportedDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                    Install Date
                  </label>
                  <input
                    type="date"
                    value={installDate}
                    onChange={(e) => setInstallDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none"
                  />
                </div>
              </div>

              {/* Assign to Installer (Required select with automatic email dispatch indicator) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                  Assign to Crew / Installer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={installerId}
                    onChange={(e) => setInstallerId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-medium"
                  >
                    <option value="">-- Leave Unassigned --</option>
                    {installers.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.fullName} ({inst.email})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedInstaller && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#0F5CC4] bg-[#0F5CC4]/5 p-2 rounded-lg border border-[#0F5CC4]/15">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      An automatic notification email will be sent immediately to{' '}
                      <strong>{selectedInstaller.email}</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Priority, Responsibility, Billing */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CallPriority)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none font-bold uppercase"
                  >
                    <option value="high">High (Red)</option>
                    <option value="mid">Mid (Amber)</option>
                    <option value="low">Low (Slate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                    Responsibility
                  </label>
                  <select
                    value={responsibility}
                    onChange={(e) => setResponsibility(e.target.value as Responsibility)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none capitalize"
                  >
                    <option value="installer">Installer</option>
                    <option value="office">Office</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="client">Client</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                    Billing Status
                  </label>
                  <select
                    value={billing}
                    onChange={(e) => setBilling(e.target.value as BillingType)}
                    className="w-full text-xs p-2.5 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none capitalize"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="undecided">Undecided</option>
                  </select>
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-1">
                  Issue Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the complaint in detail: what is leaking, loose, broken, or needs adjustment..."
                  className="w-full text-xs p-3 bg-white border border-[#DFE2DE] rounded-lg focus:border-[#0F5CC4] outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Right Column (5 cols): Photo & Video Dropzone per Spec */}
            <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#DFE2DE] md:pl-6 pt-4 md:pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A424B]">
                    Client Photos & Videos
                  </label>
                  <span className="text-[11px] text-[#6B7A88]">Up to 100 MB</span>
                </div>
                <p className="text-xs text-[#6B7A88]">
                  Upload customer-submitted photos or short video clips. These will be viewable on the installer&apos;s phone.
                </p>

                {/* Dropzone */}
                <label className="border-2 border-dashed border-[#DFE2DE] hover:border-[#0F5CC4] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#FBFBF9]">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-12 h-12 rounded-full bg-[#0F5CC4]/10 text-[#0F5CC4] flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#0F5CC4]">Click to browse or drop files</span>
                  <span className="text-[11px] text-[#6B7A88] mt-1 text-center">
                    JPG, PNG, MP4, MOV up to 100 MB
                  </span>
                </label>

                {/* Uploaded File List */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 bg-[#FBFBF9] rounded-lg border border-[#DFE2DE] text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {att.kind === 'video' ? (
                            <Film className="w-4 h-4 text-[#0F5CC4] shrink-0" />
                          ) : (
                            <Camera className="w-4 h-4 text-[#0F5CC4] shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="font-medium text-[#12161A] truncate">{att.fileName}</p>
                            <p className="text-[10px] text-[#6B7A88]">{formatBytes(att.sizeBytes)}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RLS Notification Notice */}
              <div className="mt-4 p-3 bg-[#F0F2F0] rounded-xl text-[11px] text-[#3A424B] border border-[#DFE2DE]">
                <strong>Database Isolation:</strong> Only the assigned crew ({selectedInstaller?.fullName || 'Selected Installer'}) will be able to view this call on their phone portal.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[#DFE2DE] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#3A424B] hover:text-[#12161A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0F5CC4] hover:bg-[#0E52B0] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create & Dispatch Call'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
