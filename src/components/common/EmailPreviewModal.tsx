import React from 'react';
import { X, Mail, CheckCircle2, Clock } from 'lucide-react';
import { NotificationLog } from '../../types';
import { formatDate } from '../../lib/utils';

interface EmailPreviewModalProps {
  notification: NotificationLog | null;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-2xl w-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl border border-[#DFE2DE]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F5CC4]/10 text-[#0F5CC4] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#12161A]">Automatic Email Dispatch</h3>
              <p className="text-xs text-[#3A424B]">
                Triggered upon call assignment • Sent via Resend API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata */}
        <div className="px-6 py-3 bg-[#F0F2F0] border-b border-[#DFE2DE] text-xs space-y-1.5 font-mono">
          <div className="flex">
            <span className="w-20 text-[#6B7A88]">To:</span>
            <span className="font-medium text-[#12161A]">
              {notification.recipientName} &lt;{notification.recipientEmail}&gt;
            </span>
          </div>
          <div className="flex">
            <span className="w-20 text-[#6B7A88]">Subject:</span>
            <span className="font-medium text-[#12161A]">{notification.subject}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status: Delivered ({notification.status})</span>
            </div>
            <span className="text-[#6B7A88] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(notification.sentAt)}
            </span>
          </div>
        </div>

        {/* Rendered Email Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-[#F8F9F8]">
          <div
            className="prose max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: notification.bodyHtml }}
          />
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-white border-t border-[#DFE2DE] flex items-center justify-between text-xs text-[#6B7A88]">
          <span>Logged in database: <code>notification_log</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#12161A] text-white font-medium rounded-lg text-xs hover:bg-[#3A424B]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
