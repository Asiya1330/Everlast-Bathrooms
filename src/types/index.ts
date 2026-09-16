export type UserRole = 'admin' | 'office' | 'installer';
export type CallPriority = 'low' | 'mid' | 'high';
export type CallStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type Responsibility = 'installer' | 'office' | 'manufacturer' | 'client' | 'unknown';
export type BillingType = 'unpaid' | 'paid' | 'undecided';
export type AttachmentKind = 'image' | 'video' | 'document';
export type AttachmentPhase = 'reported' | 'resolution';
export type NoteVisibility = 'shared' | 'internal';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  email: string;
  phone?: string;
  isActive: boolean;
  notifyByEmail: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  serviceCallId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: AttachmentKind;
  phase: AttachmentPhase;
  uploadedBy: string;
  uploaderName?: string;
  createdAt: string;
  url: string; // Blob or signed URL
}

export interface ServiceCallNote {
  id: string;
  serviceCallId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  body: string;
  visibility: NoteVisibility;
  createdAt: string;
}

export interface ServiceCall {
  id: string;
  jobNumber: string; // Reference field, non-unique per spec (e.g. 1537, 1577)
  clientId: string;
  client?: Client;
  installerId?: string | null;
  installer?: UserProfile | null;
  reportedDate: string; // YYYY-MM-DD
  installDate?: string | null; // YYYY-MM-DD
  priority: CallPriority;
  description: string;
  responsibility: Responsibility;
  billing: BillingType;
  status: CallStatus;
  completionNote?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  completedByName?: string | null;
  dueDate?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  notes?: ServiceCallNote[];
}

export interface NotificationLog {
  id: string;
  serviceCallId: string;
  jobNumber: string;
  clientName: string;
  recipientEmail: string;
  recipientName: string;
  eventType: 'new_call' | 'updated' | 'reassigned' | 'overdue' | 'completed';
  subject: string;
  bodyHtml: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
  sentAt: string;
  createdAt: string;
}

export interface InstallerMonthlyStat {
  id: string;
  installerId: string;
  installerName: string;
  periodMonth: string; // YYYY-MM-01
  projectsCompleted: number;
  updatedAt: string;
}

export interface InstallerRate90d {
  installerId: string;
  fullName: string;
  totalProjects: number;
  totalServiceCalls: number;
  serviceCallPct: number | null;
}
