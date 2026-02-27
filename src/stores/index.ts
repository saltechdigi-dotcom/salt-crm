// ==========================================
// CENTRALIZED STORES INDEX
// ==========================================
// Import stores by domain for clean, scalable architecture

// Admin domain (Super Admin) - explicit exports to avoid type-name collisions
export { adminStore, useAdminStore } from './admin/admin-store';

// Leads domain
export * from './leads';

// Sales domain
export * from './sales';

// Support domain
export * from './support';

// Labels domain
export * from './labels';
