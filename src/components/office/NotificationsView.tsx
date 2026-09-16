import React, { useState } from 'react';
import { Mail, CheckCircle2, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { NotificationLog } from '../../types';
import { formatDate } from '../../lib/utils';
import { EmailPreviewModal } from '../common/EmailPreviewModal';

interface NotificationsViewProps {
  logs: NotificationLog[];
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#DFE2DE] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#12161A] flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0F5CC4]" />
            <span>Automatic Email Notification Log</span>
          </h2>
          <p className="text-xs text-[#6B7A88] mt-1">
            Audit trail of all transactional emails dispatched to crews via Resend API.
            Crews receive these instantly when new service calls are assigned or updated.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>Resend Dispatcher Active</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-[#DFE2DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F0F2F0] text-[#3A424B] border-b border-[#DFE2DE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject & Job</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE2DE]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FBFBF9] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[11px] text-[#12161A] whitespace-nowrap uppercase">
                      <span className="px-2 py-0.5 bg-[#0F5CC4]/10 text-[#0F5CC4] rounded">
                        {log.eventType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#12161A]">
                      <div>{log.recipientName}</div>
                      <div className="text-[11px] text-[#6B7A88] font-mono">{log.recipientEmail}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[#3A424B]">
                      <div className="font-semibold text-[#12161A] truncate">{log.subject}</div>
                      <div className="text-[11px] text-[#6B7A88]">Job #{log.jobNumber} • {log.clientName}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B7A88] whitespace-nowrap font-mono text-[11px]">
                      {formatDate(log.sentAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-[#FBFBF9] hover:bg-gray-100 border border-[#DFE2DE] rounded-lg text-xs font-semibold text-[#0F5CC4] flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Email</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6B7A88]">
                    No email notifications logged yet. Create a call to trigger an automatic dispatch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmailPreviewModal
        notification={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
