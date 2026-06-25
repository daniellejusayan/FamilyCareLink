/**
 * Family CareLink — Mock Database (Prototype)
 * Simulates Supabase data for all dashboards.
 * In production: replace all DB.get*() calls with Supabase queries.
 */

const DB = {
  patients: [
    {
      id: 'pat_001',
      name: 'Rosa dela Cruz',
      age: 78,
      tier: 'silver',
      branch: 'Aurora Hill',
      location: 'Baguio City',
      sponsor_id: 'usr_001',
      nurse_id: 'usr_002',
      photo: null,
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      consent_granted: true,
      consent_timestamp: '2026-01-15T08:00:00Z',
      consent_expiry: '2027-01-15T08:00:00Z',
      subscription: {
        plan: 'Silver — 26 visits/month',
        status: 'active',
        expiry: '2026-12-31',
        monthly_fee: 4500,
        visits_used: 18,
        visits_total: 26,
      },
    },
  ],

  nurses: [
    {
      id: 'usr_002',
      name: 'RN Cathy Ramirez',
      credentials: 'RN, BSN',
      branch: 'Aurora Hill',
      photo: null,
      phone: '+63 917 123 4567',
      schedule_today: [
        { patient_id: 'pat_001', time: '9:00 AM - 1:00 PM', status: 'in_progress' },
        { patient_id: 'pat_002', time: '2:00 PM - 4:00 PM', status: 'scheduled' },
      ],
    },
  ],

  visits: [
    {
      id: 'vis_001',
      patient_id: 'pat_001',
      nurse_id: 'usr_002',
      date: '2026-06-25',
      time_start: '9:00 AM',
      time_end: '1:00 PM',
      status: 'in_progress',
      vitals: {
        bp_systolic: 118,
        bp_diastolic: 76,
        heart_rate: 72,
        temperature: 36.6,
        spo2: 97,
        blood_sugar: 110,
        weight: 58.5,
      },
      tasks: [
        { id: 't1', name: 'Medications Given', done: true },
        { id: 't2', name: 'Hygiene Assistance', done: true },
        { id: 't3', name: 'Breakfast', done: false },
        { id: 't4', name: 'Exercise', done: false },
        { id: 't5', name: 'Housekeeping', done: false },
      ],
      notes: 'Patient in good spirits. BP slightly elevated but within acceptable range. Reminded to take medications on time.',
      family_notified: true,
    },
    {
      id: 'vis_002',
      patient_id: 'pat_001',
      nurse_id: 'usr_002',
      date: '2026-06-24',
      time_start: '9:00 AM',
      time_end: '1:00 PM',
      status: 'completed',
      vitals: {
        bp_systolic: 122,
        bp_diastolic: 78,
        heart_rate: 74,
        temperature: 36.5,
        spo2: 98,
        blood_sugar: 115,
        weight: 58.5,
      },
      tasks: [
        { id: 't1', name: 'Medications Given', done: true },
        { id: 't2', name: 'Hygiene Assistance', done: true },
        { id: 't3', name: 'Breakfast', done: true },
        { id: 't4', name: 'Exercise', done: true },
        { id: 't5', name: 'Housekeeping', done: true },
      ],
      notes: 'All tasks completed. Patient ate well.',
      family_notified: true,
    },
    {
      id: 'vis_003',
      patient_id: 'pat_001',
      nurse_id: 'usr_002',
      date: '2026-06-23',
      time_start: '9:00 AM',
      time_end: '1:00 PM',
      status: 'completed',
      vitals: {
        bp_systolic: 130,
        bp_diastolic: 82,
        heart_rate: 78,
        temperature: 36.8,
        spo2: 96,
        blood_sugar: 125,
        weight: 58.7,
      },
      tasks: [
        { id: 't1', name: 'Medications Given', done: true },
        { id: 't2', name: 'Hygiene Assistance', done: true },
        { id: 't3', name: 'Breakfast', done: true },
        { id: 't4', name: 'Exercise', done: false },
        { id: 't5', name: 'Housekeeping', done: true },
      ],
      notes: 'Slightly elevated BP today. Advised to rest. Exercise skipped due to fatigue.',
      family_notified: true,
    },
  ],

  vitals_history: [
    { date: 'Jun 19', bp_systolic: 120, bp_diastolic: 75, heart_rate: 70 },
    { date: 'Jun 20', bp_systolic: 125, bp_diastolic: 79, heart_rate: 72 },
    { date: 'Jun 21', bp_systolic: 119, bp_diastolic: 74, heart_rate: 69 },
    { date: 'Jun 22', bp_systolic: 122, bp_diastolic: 77, heart_rate: 71 },
    { date: 'Jun 23', bp_systolic: 130, bp_diastolic: 82, heart_rate: 78 },
    { date: 'Jun 24', bp_systolic: 122, bp_diastolic: 78, heart_rate: 74 },
    { date: 'Jun 25', bp_systolic: 118, bp_diastolic: 76, heart_rate: 72 },
  ],

  medications: [
    { id: 'med_001', name: 'Amlodipine 5mg', time: 'Morning', status: 'given', for: 'Hypertension' },
    { id: 'med_002', name: 'Metformin 500mg', time: 'Morning', status: 'given', for: 'Diabetes' },
    { id: 'med_003', name: 'Losartan 50mg', time: 'Evening', status: 'pending', for: 'Hypertension' },
    { id: 'med_004', name: 'Aspirin 80mg', time: 'Evening', status: 'pending', for: 'Cardiovascular' },
  ],

  messages: [
    {
      id: 'msg_001',
      from_id: 'usr_002',
      to_id: 'usr_001',
      from_name: 'RN Cathy Ramirez',
      content: 'Good morning! I just arrived. Lola Rosa is in a good mood today. 😊',
      timestamp: '2026-06-25T09:12:00Z',
      read: true,
    },
    {
      id: 'msg_002',
      from_id: 'usr_002',
      to_id: 'usr_001',
      from_name: 'RN Cathy Ramirez',
      content: 'Vitals recorded. BP is 118/76, Heart Rate 72. All normal. Medications given.',
      timestamp: '2026-06-25T09:30:00Z',
      read: false,
    },
    {
      id: 'msg_003',
      from_id: 'usr_001',
      to_id: 'usr_002',
      from_name: 'Maria Santos',
      content: 'Thank you Nurse Cathy! Please make sure she eats breakfast 🙏',
      timestamp: '2026-06-25T09:35:00Z',
      read: true,
    },
  ],

  emergency_alerts: [],

  admin_stats: {
    total_patients: 47,
    active_subscriptions: 42,
    nurses_on_duty: 8,
    alerts_today: 1,
    monthly_revenue: 189000,
    visits_completed_today: 31,
    visits_scheduled_today: 38,
    consent_active: 44,
    consent_expired: 3,
  },

  // Helper methods
  getPatientById(id) {
    return this.patients.find(p => p.id === id) || null;
  },

  getVisitsByPatient(patientId) {
    return this.visits.filter(v => v.patient_id === patientId);
  },

  getTodayVisit(patientId) {
    const today = new Date().toISOString().split('T')[0];
    return this.visits.find(v => v.patient_id === patientId && v.date === today) || null;
  },

  getMessagesByUser(userId) {
    return this.messages.filter(m => m.from_id === userId || m.to_id === userId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  getUnreadCount(userId) {
    return this.messages.filter(m => m.to_id === userId && !m.read).length;
  },
};

window.DB = DB;
