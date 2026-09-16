import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  DollarSign,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { Attachment, ServiceCall, UserProfile } from '../../types';
import {
  formatDate,
  formatRelativeDate,
  getPriorityBorderColor,
  getStatusBadge,
} from '../../lib/utils';
import { CompleteModal } from './CompleteModal';
import { BlockedModal } from './BlockedModal';
import { MediaLightbox } from '../common/MediaLightbox';

interface CallDetailProps {
  call: ServiceCall;
  currentUser: UserProfile;
  onBack: () => void;
  onStatusUpdate: (status: 'completed' | 'blocked' | 'in_progress', note?: string, resolutionAttachments?: Attachment[]) => void;
  onAddNote: (noteText: string) => void;
}

export const CallDetail: React.FC<CallDetailProps> = ({
  call,
  currentUser,
  onBack,
  onStatusUpdate,
  onAddNote,
}) => {
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<Attachment | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showAddNoteSheet, setShowAddNoteSheet] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const statusBadge = getStatusBadge(call.status);
  const priorityColor = getPriorityBorderColor(call.priority);

  const reportedAttachments = (call.attachments || []).filter((a) => a.phase === 'reported');
  const resolutionAttachments = (call.attachments || []).filter((a) => a.phase === 'resolution');

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText.trim());
    setNewNoteText('');
    setShowAddNoteSheet(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FBFBF9] text-[#12161A] pb-28">
      {/* Top sticky navigation bar with persistent top-left arrow */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3.5 bg-white/95 backdrop-blur-sm border-b border-[#DFE2DE] shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#12161A] hover:text-[#0F5CC4] p-1.5 -ml-1 rounded-lg transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F5CC4]" />
          <span>My Calls</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: priorityColor }}
            title={`Priority: ${call.priority}`}
          />
          <span className="text-xs font-mono font-bold text-[#12161A] tabular-nums">
            JOB #{call.jobNumber}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 max-w-lg mx-auto w-full">
        {/* 1. Client Card */}
        <div className="bg-white rounded-xl p-4 border border-[#DFE2DE] shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#12161A] tracking-tight">
                {call.client?.name || 'Customer'}
              </h1>
              <p className="text-xs text-[#6B7A88] mt-0.5">
                Reported {formatRelativeDate(call.reportedDate)} ({formatDate(call.reportedDate)})
              </p>
            </div>
            {call.client?.phone && (
              <a
                href={`tel:${call.client.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Address if available */}
          {call.client?.address && (
            <div className="mt-3 pt-3 border-t border-[#DFE2DE] flex items-start gap-2 text-xs text-[#3A424B]">
              <MapPin className="w-4 h-4 text-[#0F5CC4] shrink-0 mt-0.5" />
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(call.client.address)}`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#0F5CC4] leading-relaxed"
              >
                {call.client.address}
              </a>
            </div>
          )}
        </div>

        {/* 2. The Issue - Full text, prominent */}
        <div className="bg-white rounded-xl p-4 border border-[#DFE2DE] shadow-xs">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-[#3A424B]">
            <AlertCircle className="w-4 h-4 text-[#0F5CC4]" />
            <span>Issue Reported</span>
          </div>
          <div className="text-base text-[#12161A] font-medium leading-relaxed bg-[#FBFBF9] p-3.5 rounded-lg border-l-4 border-[#0F5CC4]">
            {call.description}
          </div>

          {/* If call has blocked/completion note */}
          {call.completionNote && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <span className="font-semibold text-amber-900 block mb-0.5">
                {call.status === 'blocked' ? 'Blocked Note:' : 'Completion Note:'}
              </span>
              <p className="text-amber-800 leading-normal">{call.completionNote}</p>
            </div>
          )}
        </div>

        {/* 3. Photos and Videos uploaded by Office */}
        <div className="bg-white rounded-xl p-4 border border-[#DFE2DE] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3A424B]">
              <Paperclip className="w-4 h-4 text-[#0F5CC4]" />
              <span>Office Attachments ({reportedAttachments.length})</span>
            </div>
            <span className="text-[11px] text-[#6B7A88]">Tap to enlarge</span>
          </div>

          {reportedAttachments.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {reportedAttachments.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setActiveLightboxMedia(file)}
                  className="relative aspect-4/3 rounded-lg overflow-hidden border border-[#DFE2DE] bg-gray-100 cursor-pointer group active:scale-98 transition-transform"
                >
                  {file.kind === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white p-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:bg-[#0F5CC4] transition-colors">
                        <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
                      </div>
                      <span className="text-[11px] font-medium text-center truncate w-full">
                        {file.fileName}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={file.url}
                      alt={file.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-[10px] text-white px-2 py-1 truncate">
                    {file.fileName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B7A88] italic py-2">
              No photos or videos attached by the office for this call.
            </p>
          )}

          {/* Resolution Attachments if any */}
          {resolutionAttachments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#DFE2DE]">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-2">
                Resolution ("After") Photos ({resolutionAttachments.length})
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {resolutionAttachments.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setActiveLightboxMedia(file)}
                    className="relative aspect-4/3 rounded-lg overflow-hidden border border-emerald-200 bg-emerald-50 cursor-pointer"
                  >
                    <img
                      src={file.url}
                      alt={file.fileName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white px-2 py-1 truncate">
                      Fixed • {file.fileName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Facts Grid (Reported, Installed, Priority, Responsibility, Paid/Unpaid) */}
        <div className="bg-white rounded-xl p-4 border border-[#DFE2DE] shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#3A424B] mb-3">
            Call Details & Responsibility
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-[#FBFBF9] rounded-lg border border-[#DFE2DE]/60">
              <span className="text-[#6B7A88] block text-[11px]">Install Date</span>
              <span className="font-semibold text-[#12161A] mt-0.5 block">
                {formatDate(call.installDate)}
              </span>
            </div>

            <div className="p-2.5 bg-[#FBFBF9] rounded-lg border border-[#DFE2DE]/60">
              <span className="text-[#6B7A88] block text-[11px]">Priority</span>
              <span
                className="font-bold uppercase mt-0.5 block"
                style={{ color: priorityColor }}
              >
                {call.priority}
              </span>
            </div>

            <div className="p-2.5 bg-[#FBFBF9] rounded-lg border border-[#DFE2DE]/60">
              <span className="text-[#6B7A88] block text-[11px]">Responsibility</span>
              <span className="font-semibold text-[#12161A] capitalize mt-0.5 block">
                {call.responsibility}
              </span>
            </div>

            <div className="p-2.5 bg-[#FBFBF9] rounded-lg border border-[#DFE2DE]/60">
              <span className="text-[#6B7A88] block text-[11px]">Billing Status</span>
              <span className={`font-semibold capitalize mt-0.5 block ${call.billing === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {call.billing}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Notes Thread */}
        <div className="bg-white rounded-xl p-4 border border-[#DFE2DE] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3A424B]">
              <MessageSquare className="w-4 h-4 text-[#0F5CC4]" />
              <span>Notes Thread ({call.notes?.length || 0})</span>
            </div>
            <button
              onClick={() => setShowAddNoteSheet(true)}
              className="text-xs font-semibold text-[#0F5CC4] hover:underline"
            >
              + Add Note
            </button>
          </div>

          {call.notes && call.notes.length > 0 ? (
            <div className="space-y-3">
              {call.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-[#FBFBF9] border border-[#DFE2DE] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[#6B7A88]">
                    <span className="font-semibold text-[#12161A]">{note.authorName}</span>
                    <span className="text-[10px]">{formatRelativeDate(note.createdAt)}</span>
                  </div>
                  <p className="text-[#3A424B] leading-relaxed">{note.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B7A88] italic py-1">
              No notes recorded yet. You can add notes in English or Spanish.
            </p>
          )}
        </div>
      </div>

      {/* 6. Actions PINNED TO BOTTOM OF VIEWPORT (Per Spec Section 7.3) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DFE2DE] p-3 shadow-lg max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {call.status !== 'completed' ? (
            <>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark complete</span>
              </button>

              <button
                onClick={() => setShowBlockedModal(true)}
                className="py-3 px-3.5 bg-amber-100 hover:bg-amber-200 active:scale-98 text-amber-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                title="Can't complete"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Can't complete</span>
              </button>

              <button
                onClick={() => setShowAddNoteSheet(true)}
                className="p-3 bg-[#F0F2F0] hover:bg-[#DFE2DE] text-[#12161A] rounded-xl transition-colors"
                title="Add Note"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Call marked complete on {formatDate(call.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Complete Modal Sheet */}
      <CompleteModal
        call={call}
        currentUser={currentUser}
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={(note, photos) => {
          setShowCompleteModal(false);
          onStatusUpdate('completed', note, photos);
        }}
      />

      {/* Blocked Modal Sheet */}
      <BlockedModal
        call={call}
        currentUser={currentUser}
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        onConfirm={(reason) => {
          setShowBlockedModal(false);
          onStatusUpdate('blocked', reason);
        }}
      />

      {/* Add Note Sheet */}
      {showAddNoteSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setShowAddNoteSheet(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl border border-[#DFE2DE]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-[#12161A] mb-2">Add Note to Work Order</h3>
            <form onSubmit={handleSendNote}>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type note in English or Spanish..."
                rows={3}
                autoFocus
                className="w-full p-2.5 text-xs rounded-lg border border-[#DFE2DE] focus:border-[#0F5CC4] outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteSheet(false)}
                  className="px-3 py-1.5 text-xs text-[#6B7A88] hover:text-[#12161A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-4 py-1.5 bg-[#0F5CC4] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  Post Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Lightbox */}
      <MediaLightbox
        attachment={activeLightboxMedia}
        onClose={() => setActiveLightboxMedia(null)}
      />
    </div>
  );
};
