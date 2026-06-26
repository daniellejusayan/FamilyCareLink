/**
 * Family CareLink — Auth Module (Prototype)
 * Simulates Supabase Auth for prototype testing.
 * In production: replace with real Supabase calls.
 *
 * ROLE ARCHITECTURE:
 *  ofw      — Family member working abroad (OFW). Focused on international remittance, timezone, global comms.
 *  senior   — Family member working LOCALLY within the Philippines (different province/city). Focused on
 *             PhilHealth, GCash/Maya, provincial logistics. NOT the elderly patient themselves.
 *  expat    — Foreign national / retiree family. Focused on international health insurance, embassy contacts.
 *  nurse    — Registered Nurse / Care Associate. Logs visits, vitals, tasks.
 *  admin    — Branch admin. Manages patients, staff, billing, consent.
 *  companion— Standalone lightweight view for the ELDERLY PATIENT themselves.
 *             Ultra-simple medication checker + daily vitals. No complex navigation.
 */

// ── Mock User Database ─────────────────────────────────────
const MOCK_USERS = {
  'ofw@test.com': {
    id: 'usr_001',
    email: 'ofw@test.com',
    password: 'test1234',
    role: 'ofw',
    name: 'Maria Santos',
    family_category: 'ofw',           // Dashboard tailoring key
    location: 'Dubai, UAE',
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
    // "Senior" = LOCAL PH FAMILY. Works in a different province/city within the Philippines.
    // NOT the elderly patient. The elderly patient uses the companion app.
    id: 'usr_004',
    email: 'senior@test.com',
    password: 'test1234',
    role: 'senior',
    name: 'Carlo dela Cruz',          // Son, works in Makati
    family_category: 'local_ph',     // Dashboard tailoring key
    location: 'Makati City, Metro Manila',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    patient_id: 'pat_001',
  },
  'expat@test.com': {
    id: 'usr_005',
    email: 'expat@test.com',
    password: 'test1234',
    role: 'expat',
    name: 'James Miller',
    family_category: 'expat',         // Dashboard tailoring key
    location: 'Baguio City, Philippines',
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    language: 'en',
    patient_id: 'pat_001',
  },
  'companion@test.com': {
    // The elderly patient's own simple medication checker
    id: 'usr_006',
    email: 'companion@test.com',
    password: '1234',                 // Simple PIN for elderly user
    role: 'companion',
    name: 'Rosa dela Cruz',           // The actual elderly patient
    consent_granted: true,
    consent_timestamp: new Date().toISOString(),
    patient_id: 'pat_001',
  },
};

// ── Session Management ─────────────────────────────────────
const SESSION_KEY = 'carelink_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 min

// Resolve the correct path to index.html regardless of how the app is served
function getLoginPath() {
  // Works for both file:// and http:// (Live Server)
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  if (window.location.protocol === 'file:') {
    // Count how deep we are from root; go up that many levels
    const ups = depth > 0 ? '../'.repeat(depth) : '';
    return ups + 'index.html';
  }
  return '/index.html';
}

const Auth = {
  /**
   * Sign in a user
   * @param {string} email
   * @param {string} password
   * @param {string} role - Expected role
   * @returns {{ success: boolean, user?: object, error?: string }}
   */
  signIn(email, password, role) {
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

    const session = {
      user: { ...user, password: undefined },
      expires_at: Date.now() + SESSION_TIMEOUT,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    AuditLog.write({ action: 'LOGIN_SUCCESS', resource: 'auth', details: { email, role } });
    return { success: true, user: session.user };
  },

  /**
   * Sign out — clears session and redirects to login page.
   * Uses relative path so it works from both file:// and http://
   */
  signOut() {
    const session = this.getSession();
    if (session) {
      AuditLog.write({ action: 'LOGOUT', resource: 'auth', details: { email: session.user.email } });
    }
    localStorage.removeItem(SESSION_KEY);
    window.location.href = getLoginPath();
  },

  /**
   * Get current session (null if expired or not set)
   */
  getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (Date.now() > session.expires_at) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      // Refresh expiry on activity
      session.expires_at = Date.now() + SESSION_TIMEOUT;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  /**
   * Get current user or redirect to login
   */
  requireAuth(expectedRole = null) {
    const session = this.getSession();
    if (!session) {
      window.location.href = getLoginPath();
      return null;
    }
    if (expectedRole && session.user.role !== expectedRole) {
      window.location.href = getLoginPath();
      return null;
    }
    return session.user;
  },

  /**
   * Role-to-dashboard routing
   */
  redirectToDashboard(role) {
    const routes = {
      ofw:       'src/pages/ofw/dashboard.html',
      nurse:     'src/pages/nurse/dashboard.html',
      admin:     'src/pages/admin/dashboard.html',
      senior:    'src/pages/senior/dashboard.html',
      expat:     'src/pages/expat/dashboard.html',
      companion: 'src/pages/companion/index.html',
    };
    const path = routes[role];
    if (path) {
      // Resolve relative to index.html location (always the root)
      if (window.location.protocol === 'file:') {
        // We're on the login page at root; just navigate relatively
        window.location.href = path;
      } else {
        window.location.href = '/' + path;
      }
    }
  },
};

// ── Audit Log Module ───────────────────────────────────────
const AuditLog = {
  STORAGE_KEY: 'carelink_audit_logs',
  PENDING_KEY: 'carelink_pending_audit_logs',

  write(entry, consentRequired = false) {
    const raw = localStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    const log = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
      user_id: session?.user?.id || 'anonymous',
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || {},
      timestamp: new Date().toISOString(),
      synced: navigator.onLine,
    };

    const logs = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    logs.unshift(log);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs.slice(0, 500)));

    if (!navigator.onLine) {
      const pending = JSON.parse(localStorage.getItem(this.PENDING_KEY) || '[]');
      pending.push(log);
      localStorage.setItem(this.PENDING_KEY, JSON.stringify(pending));
    }
    return log;
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  },

  syncPending() {
    const pending = JSON.parse(localStorage.getItem(this.PENDING_KEY) || '[]');
    if (pending.length === 0) return;
    console.log(`[AuditLog] Syncing ${pending.length} pending offline logs...`);
    // TODO (prod): insert pending to Supabase audit_logs
    localStorage.removeItem(this.PENDING_KEY);
    console.log('[AuditLog] Sync complete.');
  },
};

window.addEventListener('online', () => { AuditLog.syncPending(); });

// ── Consent Verification ───────────────────────────────────
const Consent = {
  verify(record) {
    if (!record) return false;
    if (!record.consent_granted) return false;
    if (record.consent_expiry && new Date(record.consent_expiry) < new Date()) return false;
    return true;
  },

  blockAndWarn(containerEl) {
    if (containerEl) {
      containerEl.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center">
          <div class="text-4xl mb-3">🔒</div>
          <h3 class="font-semibold text-gray-700 mb-1">Consent Required</h3>
          <p class="text-sm text-gray-500">Patient data cannot be displayed without active consent. Please contact the admin.</p>
        </div>`;
    }
  },
};

window.Auth = Auth;
window.AuditLog = AuditLog;
window.Consent = Consent;
