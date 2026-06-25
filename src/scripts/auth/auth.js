/**
 * Family CareLink — Auth Module (Prototype)
 * Simulates Supabase Auth for prototype testing.
 * In production: replace with real Supabase calls.
 */

// ── Mock User Database ─────────────────────────────────────
const MOCK_USERS = {
  'ofw@test.com': {
    id: 'usr_001',
    email: 'ofw@test.com',
    password: 'test1234',
    role: 'ofw',
    name: 'Maria Santos',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    patient_id: 'pat_001',
  },
  'nurse@test.com': {
    id: 'usr_002',
    email: 'nurse@test.com',
    password: 'test1234',
    role: 'nurse',
    name: 'RN Cathy Ramirez',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    branch: 'Aurora Hill',
  },
  'admin@test.com': {
    id: 'usr_003',
    email: 'admin@test.com',
    password: 'test1234',
    role: 'admin',
    name: 'Ana Santos',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    twofa_required: true,
  },
  'senior@test.com': {
    id: 'usr_004',
    email: 'senior@test.com',
    password: 'test1234',
    role: 'senior',
    name: 'Rosa dela Cruz',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
  },
  'expat@test.com': {
    id: 'usr_005',
    email: 'expat@test.com',
    password: 'test1234',
    role: 'expat',
    name: 'James Miller',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    language: 'en',
  },
};

// ── Session Management ─────────────────────────────────────
const SESSION_KEY = 'carelink_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

const Auth = {
  /**
   * Sign in a user
   * @param {string} email
   * @param {string} password
   * @param {string} role - Expected role
   * @returns {{ success: boolean, user?: object, error?: string }}
   */
  signIn(email, password, role) {
    // Audit log attempt
    AuditLog.write({
      action: 'LOGIN_ATTEMPT',
      resource: 'auth',
      details: { email, role },
    });

    const user = MOCK_USERS[email.toLowerCase()];

    if (!user) {
      AuditLog.write({ action: 'LOGIN_FAILED', resource: 'auth', details: { email, reason: 'user_not_found' } });
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.password !== password) {
      AuditLog.write({ action: 'LOGIN_FAILED', resource: 'auth', details: { email, reason: 'wrong_password' } });
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.role !== role) {
      AuditLog.write({ action: 'LOGIN_FAILED', resource: 'auth', details: { email, reason: 'role_mismatch' } });
      return { success: false, error: `This account is registered as "${user.role}", not "${role}".` };
    }

    // Set session
    const session = {
      user: { ...user, password: undefined }, // never store password in session
      expires_at: Date.now() + SESSION_TIMEOUT,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    AuditLog.write({ action: 'LOGIN_SUCCESS', resource: 'auth', details: { email, role } });

    return { success: true, user: session.user };
  },

  /**
   * Sign out current user
   */
  signOut() {
    const session = this.getSession();
    if (session) {
      AuditLog.write({ action: 'LOGOUT', resource: 'auth', details: { email: session.user.email } });
    }
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '/index.html';
  },

  /**
   * Get current session (null if expired or not set)
   */
  getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (Date.now() > session.expires_at) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Refresh expiry on activity
    session.expires_at = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session;
  },

  /**
   * Get current user or redirect to login
   */
  requireAuth(expectedRole = null) {
    const session = this.getSession();
    if (!session) {
      window.location.href = '/index.html';
      return null;
    }
    if (expectedRole && session.user.role !== expectedRole) {
      window.location.href = '/index.html';
      return null;
    }
    return session.user;
  },

  /**
   * Role-to-dashboard routing
   */
  redirectToDashboard(role) {
    const routes = {
      ofw: '/src/pages/ofw/dashboard.html',
      nurse: '/src/pages/nurse/dashboard.html',
      admin: '/src/pages/admin/dashboard.html',
      senior: '/src/pages/senior/dashboard.html',
      expat: '/src/pages/expat/dashboard.html',
    };
    const path = routes[role];
    if (path) window.location.href = path;
  },
};

// ── Audit Log Module ───────────────────────────────────────
const AuditLog = {
  STORAGE_KEY: 'carelink_audit_logs',
  PENDING_KEY: 'carelink_pending_audit_logs',

  /**
   * Write an audit log entry
   * @param {{ action: string, resource: string, resource_id?: string, details?: object }} entry
   * @param {boolean} consentRequired
   */
  write(entry, consentRequired = false) {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    const log = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      user_id: session?.user?.id || 'anonymous',
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || {},
      timestamp: new Date().toISOString(),
      synced: navigator.onLine,
    };

    // Store locally (prototype: localStorage; prod: Supabase audit_logs)
    const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    logs.unshift(log);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs.slice(0, 500))); // keep last 500

    // If offline, also add to pending queue
    if (!navigator.onLine) {
      const pending = JSON.parse(localStorage.getItem(this.PENDING_KEY) || '[]');
      pending.push(log);
      localStorage.setItem(this.PENDING_KEY, JSON.stringify(pending));
    }

    return log;
  },

  /**
   * Get all logs (for admin view)
   */
  getAll() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  },

  /**
   * Sync pending offline logs when connection restores
   * In production: insert pending logs into Supabase audit_logs table
   */
  syncPending() {
    const pending = JSON.parse(localStorage.getItem(this.PENDING_KEY) || '[]');
    if (pending.length === 0) return;

    console.log(`[AuditLog] Syncing ${pending.length} pending offline logs...`);
    // TODO (prod): insert pending logs to Supabase
    localStorage.removeItem(this.PENDING_KEY);
    console.log('[AuditLog] Sync complete.');
  },
};

// ── Auto-sync on reconnect ─────────────────────────────────
window.addEventListener('online', () => {
  AuditLog.syncPending();
});

// ── Consent Verification ───────────────────────────────────
const Consent = {
  /**
   * Verify consent before showing data
   * @param {object} record - Patient or user record with consent fields
   * @returns {boolean}
   */
  verify(record) {
    if (!record) return false;
    if (!record.consent_granted) return false;
    if (record.consent_expiry && new Date(record.consent_expiry) < new Date()) return false;
    return true;
  },

  /**
   * Block data display and show consent required UI
   */
  blockAndWarn(containerEl) {
    if (containerEl) {
      containerEl.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center">
          <div class="text-4xl mb-3">🔒</div>
          <h3 class="font-semibold text-gray-700 mb-1">Consent Required</h3>
          <p class="text-sm text-gray-500">Patient data cannot be displayed without active consent. Please contact the admin.</p>
        </div>
      `;
    }
  },
};

// ── Export to window for global access ─────────────────────
window.Auth = Auth;
window.AuditLog = AuditLog;
window.Consent = Consent;
