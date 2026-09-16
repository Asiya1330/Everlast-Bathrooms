import React, { useState } from 'react';
import { X, Database, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { configureSupabase, getSupabaseConfig, SUPABASE_SQL_SCHEMA } from '../../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    configureSupabase(url.trim(), anonKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DFE2DE] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE2DE] bg-[#FBFBF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#3ECF8E]/20 text-[#24945b] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#12161A]">Supabase Database & RLS Setup</h2>
              <p className="text-xs text-[#3A424B]">
                PostgreSQL 15 • Row-Level Security • Signed Storage Media
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* RLS Guarantee Card */}
          <div className="p-3.5 bg-[#0F5CC4]/8 border border-[#0F5CC4]/20 rounded-xl space-y-1.5 text-[#12161A]">
            <div className="flex items-center gap-1.5 font-bold text-[#0F5CC4]">
              <ShieldCheck className="w-4 h-4" />
              <span>Row-Level Security (RLS) Database Enforcement</span>
            </div>
            <p className="text-[#3A424B] leading-relaxed">
              Per Alan&apos;s spec, installers see only their assigned calls at the database engine level.
              The app enforces this using Postgres RLS policies:
              <code className="block mt-1 bg-white p-2 rounded border border-[#DFE2DE] font-mono text-[11px]">
                CREATE POLICY &quot;installers read own calls&quot; ON service_calls FOR SELECT USING (auth_role() IN (&apos;admin&apos;,&apos;office&apos;) OR installer_id = auth.uid());
              </code>
            </p>
          </div>

          {/* Connect credentials form */}
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <h3 className="font-bold text-sm text-[#12161A]">Connect Your Supabase Project (Optional)</h3>
            <p className="text-[#6B7A88]">
              By default, this portal runs an in-browser persistent database with identical RLS policy enforcement.
              You can connect your live Supabase project below at any time.
            </p>

            <div>
              <label className="block font-bold text-[#3A424B] mb-1">Project URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg font-mono text-xs outline-none focus:border-[#0F5CC4]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3A424B] mb-1">Anon / Public Key</label>
              <input
                type="text"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full p-2.5 bg-[#FBFBF9] border border-[#DFE2DE] rounded-lg font-mono text-xs outline-none focus:border-[#0F5CC4]"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#12161A] text-white font-bold rounded-lg hover:bg-[#3A424B] transition-colors"
            >
              {saved ? 'Saved & Connected!' : 'Save Credentials'}
            </button>
          </form>

          {/* SQL Schema Script */}
          <div className="pt-4 border-t border-[#DFE2DE] space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#12161A]">
                Full Supabase SQL Migration Script (Section 5)
              </h3>
              <button
                type="button"
                onClick={handleCopySchema}
                className="px-3 py-1 bg-[#F0F2F0] hover:bg-[#DFE2DE] text-[#12161A] font-bold rounded-md flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <p className="text-[#6B7A88]">
              Paste this directly into your Supabase Dashboard &gt; SQL Editor to provision all tables, enums, RPC functions, and RLS policies.
            </p>
            <pre className="p-3 bg-[#12161A] text-emerald-400 font-mono text-[11px] rounded-xl max-h-48 overflow-y-auto leading-normal">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#FBFBF9] border-t border-[#DFE2DE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#DFE2DE] hover:bg-gray-300 text-[#12161A] font-bold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
