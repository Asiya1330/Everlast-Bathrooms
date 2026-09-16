import {
  Attachment,
  Client,
  InstallerMonthlyStat,
  InstallerRate90d,
  NotificationLog,
  ServiceCall,
  ServiceCallNote,
  UserProfile,
  UserRole,
  CallStatus,
  CallPriority,
  Responsibility,
  BillingType
} from '../types';
import { sendServiceCallEmail } from './email';
import { supabase } from './supabase';

// Key for local storage - version 2 to flush previous mock data
const DB_STORAGE_KEY = 'everlast_service_portal_prod_v2';

// 1. Initial Users — Only Admin User (can create crew accounts & view dashboard)
export const SEED_USERS: UserProfile[] = [
  {
    id: 'user_alan_admin',
    fullName: 'Alan Benzaquen',
    role: 'admin',
    email: 'admin@everlastbathrooms.com',
    phone: '(555) 234-5678',
    isActive: true,
    notifyByEmail: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
];

// Seed Clients
export const SEED_CLIENTS: Client[] = [];

// Seed Service Calls
export const SEED_SERVICE_CALLS: ServiceCall[] = [];

// Seed Monthly stats (Option A denominator: projects completed per month)
export const SEED_MONTHLY_STATS: InstallerMonthlyStat[] = [];

// Initial Notification Logs
export const SEED_NOTIFICATION_LOGS: NotificationLog[] = [];

interface DatabaseState {
  users: UserProfile[];
  clients: Client[];
  serviceCalls: ServiceCall[];
  monthlyStats: InstallerMonthlyStat[];
  notificationLogs: NotificationLog[];
}

function loadState(): DatabaseState {
  if (typeof window === 'undefined') {
    return {
      users: SEED_USERS,
      clients: SEED_CLIENTS,
      serviceCalls: SEED_SERVICE_CALLS,
      monthlyStats: SEED_MONTHLY_STATS,
      notificationLogs: SEED_NOTIFICATION_LOGS,
    };
  }
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY);
    if (!raw) {
      const initial = {
        users: SEED_USERS,
        clients: SEED_CLIENTS,
        serviceCalls: SEED_SERVICE_CALLS,
        monthlyStats: SEED_MONTHLY_STATS,
        notificationLogs: SEED_NOTIFICATION_LOGS,
      };
      saveState(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading database state:', e);
    return {
      users: SEED_USERS,
      clients: SEED_CLIENTS,
      serviceCalls: SEED_SERVICE_CALLS,
      monthlyStats: SEED_MONTHLY_STATS,
      notificationLogs: SEED_NOTIFICATION_LOGS,
    };
  }
}

function saveState(state: DatabaseState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
  }
}

export const db = {
  resetToDefaults(): DatabaseState {
    const initial = {
      users: SEED_USERS,
      clients: SEED_CLIENTS,
      serviceCalls: SEED_SERVICE_CALLS,
      monthlyStats: SEED_MONTHLY_STATS,
      notificationLogs: SEED_NOTIFICATION_LOGS,
    };
    saveState(initial);
    return initial;
  },

  getUsers(): UserProfile[] {
    return loadState().users;
  },

  getActiveInstallers(): UserProfile[] {
    return loadState().users.filter((u) => u.role === 'installer' && u.isActive);
  },

  /**
   * Create Crew Member / User Account (Admin & Office only)
   */
  createCrewMember(
    crew: {
      fullName: string;
      email: string;
      phone?: string;
      role?: UserRole;
    },
    currentUser: UserProfile
  ): UserProfile {
    if (currentUser.role !== 'admin' && currentUser.role !== 'office') {
      throw new Error('Only admin or office staff can create crew accounts');
    }

    const state = loadState();
    const cleanEmail = crew.email.trim().toLowerCase();

    if (state.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists');
    }

    const newUser: UserProfile = {
      id: 'inst_' + Math.random().toString(36).substring(2, 9),
      fullName: crew.fullName.trim(),
      role: crew.role || 'installer',
      email: cleanEmail,
      phone: crew.phone?.trim() || null,
      isActive: true,
      notifyByEmail: true,
      createdAt: new Date().toISOString(),
    };

    state.users.push(newUser);
    saveState(state);

    // If Supabase is connected, asynchronously sync profile to Supabase database
    if (supabase) {
      supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          full_name: newUser.fullName,
          role: newUser.role,
          email: newUser.email,
          phone: newUser.phone,
          is_active: true,
          notify_by_email: true,
        })
        .then(({ error }) => {
          if (error) console.info('Supabase profile sync note:', error.message);
        });
    }

    return newUser;
  },

  /**
   * Toggle Active status of a team member
   */
  toggleCrewActive(userId: string, currentUser: UserProfile): UserProfile {
    if (currentUser.role !== 'admin' && currentUser.role !== 'office') {
      throw new Error('Only admin or office staff can modify team members');
    }

    const state = loadState();
    const userIndex = state.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');

    state.users[userIndex].isActive = !state.users[userIndex].isActive;
    saveState(state);
    return state.users[userIndex];
  },

  getClients(): Client[] {
    return loadState().clients;
  },

  createClient(clientData: Omit<Client, 'id' | 'createdAt'>): Client {
    const state = loadState();
    const newClient: Client = {
      id: 'client_' + Math.random().toString(36).substring(2, 9),
      ...clientData,
      createdAt: new Date().toISOString(),
    };
    state.clients.push(newClient);
    saveState(state);
    return newClient;
  },

  /**
   * DATABASE-LEVEL ROW-LEVEL SECURITY (RLS) ENFORCEMENT
   * As specified in Section 5.11:
   * "installers read own calls" policy:
   * USING (auth_role() in ('admin','office') OR installer_id = auth.uid())
   */
  getServiceCalls(currentUser: UserProfile): ServiceCall[] {
    const state = loadState();
    const allCalls = state.serviceCalls.map((call) => {
      const client = state.clients.find((c) => c.id === call.clientId);
      const installer = state.users.find((u) => u.id === call.installerId) || null;
      return { ...call, client, installer };
    });

    // RLS Policy Check
    if (currentUser.role === 'installer') {
      // Installer sees ONLY calls assigned to them
      return allCalls.filter((call) => call.installerId === currentUser.id);
    }

    // Admin & Office see ALL calls across all crews
    return allCalls;
  },

  getServiceCallById(callId: string, currentUser: UserProfile): ServiceCall | null {
    const calls = this.getServiceCalls(currentUser);
    const found = calls.find((c) => c.id === callId);
    if (!found) {
      // Check if it exists in DB to give realistic RLS security error
      const state = loadState();
      const exists = state.serviceCalls.some((c) => c.id === callId);
      if (exists && currentUser.role === 'installer') {
        throw new Error(
          "RLS Permission Denied: Policy 'installers read own calls' blocked access to this record."
        );
      }
      return null;
    }
    return found;
  },

  /**
   * Create Service Call (Admin & Office only per RLS insert policy)
   * Automatically dispatches notification email to the assigned installer!
   */
  async createServiceCall(
    data: {
      jobNumber: string;
      clientId: string;
      installerId: string | null;
      reportedDate: string;
      installDate?: string | null;
      priority: CallPriority;
      description: string;
      responsibility: Responsibility;
      billing: BillingType;
      attachments?: Attachment[];
    },
    currentUser: UserProfile
  ): Promise<ServiceCall> {
    if (currentUser.role === 'installer') {
      throw new Error("RLS Permission Denied: Installers cannot insert service calls.");
    }

    const state = loadState();
    const newCallId = 'call_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const newCall: ServiceCall = {
      id: newCallId,
      jobNumber: data.jobNumber.trim(),
      clientId: data.clientId,
      installerId: data.installerId || null,
      reportedDate: data.reportedDate,
      installDate: data.installDate || null,
      priority: data.priority,
      description: data.description.trim(),
      responsibility: data.responsibility,
      billing: data.billing,
      status: 'open',
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
      attachments: data.attachments || [],
      notes: [],
    };

    state.serviceCalls.unshift(newCall);
    saveState(state);

    // Automatic email notification if assigned to an installer
    if (newCall.installerId) {
      const assignedInstaller = state.users.find((u) => u.id === newCall.installerId);
      const client = state.clients.find((c) => c.id === newCall.clientId);
      if (assignedInstaller && assignedInstaller.notifyByEmail) {
        const emailRecord = await sendServiceCallEmail({
          call: { ...newCall, client, installer: assignedInstaller },
          installer: assignedInstaller,
          eventType: 'new_call',
        });
        state.notificationLogs.unshift(emailRecord);
        saveState(state);
      }
    }

    return newCall;
  },

  /**
   * Update Service Call (Office & Admin)
   */
  async updateServiceCall(
    callId: string,
    updates: Partial<ServiceCall>,
    currentUser: UserProfile
  ): Promise<ServiceCall> {
    if (currentUser.role === 'installer') {
      throw new Error("RLS Permission Denied: Installers cannot perform general call updates.");
    }

    const state = loadState();
    const index = state.serviceCalls.findIndex((c) => c.id === callId);
    if (index === -1) throw new Error("Service call not found");

    const oldCall = state.serviceCalls[index];
    const isReassigned = updates.installerId && updates.installerId !== oldCall.installerId;

    const updatedCall: ServiceCall = {
      ...oldCall,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    state.serviceCalls[index] = updatedCall;
    saveState(state);

    // If reassigned, notify the new installer!
    if (isReassigned && updatedCall.installerId) {
      const newInstaller = state.users.find((u) => u.id === updatedCall.installerId);
      const client = state.clients.find((c) => c.id === updatedCall.clientId);
      if (newInstaller && newInstaller.notifyByEmail) {
        const log = await sendServiceCallEmail({
          call: { ...updatedCall, client, installer: newInstaller },
          installer: newInstaller,
          eventType: 'reassigned',
        });
        state.notificationLogs.unshift(log);
        saveState(state);
      }
    }

    return updatedCall;
  },

  /**
   * RPC: installer_complete_call
   * As specified in Section 5.11:
   * "The installer's narrow update — status and completion note only, on their own call...
   * The function accepts three statuses ('completed', 'blocked', 'in_progress') and nothing more."
   * Also enforces:
   * - "a blocked call must say why" (completion_note required)
   * - "completed calls must record when and by whom"
   */
  installerCompleteCall({
    callId,
    status,
    note,
    resolutionAttachments,
    currentUser,
  }: {
    callId: string;
    status: CallStatus;
    note?: string;
    resolutionAttachments?: Attachment[];
    currentUser: UserProfile;
  }): ServiceCall {
    if (!['completed', 'blocked', 'in_progress'].includes(status)) {
      throw new Error(`Installers cannot set status to '${status}'.`);
    }

    if (status === 'blocked' && (!note || note.trim().length === 0)) {
      throw new Error("Database Constraint Violation: A blocked call must provide a reason note.");
    }

    const state = loadState();
    const index = state.serviceCalls.findIndex((c) => c.id === callId);
    if (index === -1) throw new Error("Service call not found.");

    const call = state.serviceCalls[index];

    // Enforce installer ownership at database level
    if (currentUser.role === 'installer' && call.installerId !== currentUser.id) {
      throw new Error("RLS Violation: Call not found or not assigned to you.");
    }

    const now = new Date().toISOString();
    const updatedAttachments = [
      ...(call.attachments || []),
      ...(resolutionAttachments || []),
    ];

    const updatedNotes = [...(call.notes || [])];
    if (note && note.trim().length > 0) {
      updatedNotes.push({
        id: 'note_' + Math.random().toString(36).substring(2, 9),
        serviceCallId: call.id,
        authorId: currentUser.id,
        authorName: currentUser.fullName,
        authorRole: currentUser.role,
        body: note.trim(),
        visibility: 'shared',
        createdAt: now,
      });
    }

    const updatedCall: ServiceCall = {
      ...call,
      status,
      completionNote: note ? note.trim() : call.completionNote,
      completedAt: status === 'completed' ? now : null,
      completedBy: status === 'completed' ? currentUser.id : null,
      completedByName: status === 'completed' ? currentUser.fullName : null,
      updatedAt: now,
      attachments: updatedAttachments,
      notes: updatedNotes,
    };

    state.serviceCalls[index] = updatedCall;
    saveState(state);
    return updatedCall;
  },

  /**
   * Add a note to a service call
   */
  addNote(
    callId: string,
    body: string,
    currentUser: UserProfile,
    visibility: 'shared' | 'internal' = 'shared'
  ): ServiceCallNote {
    const state = loadState();
    const callIndex = state.serviceCalls.findIndex((c) => c.id === callId);
    if (callIndex === -1) throw new Error("Call not found");

    const call = state.serviceCalls[callIndex];
    if (currentUser.role === 'installer' && call.installerId !== currentUser.id) {
      throw new Error("RLS Violation: Cannot add note to another crew's call.");
    }

    const newNote: ServiceCallNote = {
      id: 'note_' + Math.random().toString(36).substring(2, 9),
      serviceCallId: callId,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorRole: currentUser.role,
      body: body.trim(),
      visibility,
      createdAt: new Date().toISOString(),
    };

    if (!call.notes) call.notes = [];
    call.notes.push(newNote);
    call.updatedAt = new Date().toISOString();

    state.serviceCalls[callIndex] = call;
    saveState(state);
    return newNote;
  },

  /**
   * Upload / Attach Media
   */
  addAttachment(callId: string, attachment: Attachment): void {
    const state = loadState();
    const callIndex = state.serviceCalls.findIndex((c) => c.id === callId);
    if (callIndex === -1) throw new Error("Call not found");

    const call = state.serviceCalls[callIndex];
    if (!call.attachments) call.attachments = [];
    call.attachments.push(attachment);
    call.updatedAt = new Date().toISOString();

    state.serviceCalls[callIndex] = call;
    saveState(state);
  },

  getNotificationLogs(): NotificationLog[] {
    return loadState().notificationLogs;
  },

  getMonthlyStats(): InstallerMonthlyStat[] {
    return loadState().monthlyStats;
  },

  updateMonthlyStat(installerId: string, periodMonth: string, projectsCompleted: number, user: UserProfile): void {
    const state = loadState();
    const index = state.monthlyStats.findIndex(
      (s) => s.installerId === installerId && s.periodMonth === periodMonth
    );
    const now = new Date().toISOString();

    if (index !== -1) {
      state.monthlyStats[index].projectsCompleted = projectsCompleted;
      state.monthlyStats[index].updatedAt = now;
    } else {
      const installer = state.users.find((u) => u.id === installerId);
      state.monthlyStats.push({
        id: 'stat_' + Math.random().toString(36).substring(2, 9),
        installerId,
        installerName: installer?.fullName || 'Installer',
        periodMonth,
        projectsCompleted,
        updatedAt: now,
      });
    }
    saveState(state);
  },

  /**
   * View installer_service_rate_90d (Section 5.10)
   */
  get90DayRates(): InstallerRate90d[] {
    const state = loadState();
    const installers = state.users.filter((u) => u.role === 'installer' && u.isActive);

    return installers.map((inst) => {
      // Sum projects completed in the last 90 days from monthly stats
      const totalProjects = state.monthlyStats
        .filter((s) => s.installerId === inst.id)
        .reduce((sum, s) => sum + (s.projectsCompleted || 0), 0);

      // Count service calls where responsibility = 'installer'
      const totalServiceCalls = state.serviceCalls.filter(
        (c) => c.installerId === inst.id && c.responsibility === 'installer'
      ).length;

      const serviceCallPct =
        totalProjects > 0 ? Math.round((totalServiceCalls / totalProjects) * 100) : null;

      return {
        installerId: inst.id,
        fullName: inst.fullName,
        totalProjects,
        totalServiceCalls,
        serviceCallPct,
      };
    }).sort((a, b) => (b.serviceCallPct || 0) - (a.serviceCallPct || 0));
  },
};
