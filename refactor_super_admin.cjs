const fs = require('fs');
const path = require('path');

const typesPath = path.join(process.cwd(), 'src/lib/super-admin-types.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');

// Remove all exported mock data
typesContent = typesContent.replace(/export const mockCurrentSuperAdmin: SuperAdminUser[\s\S]*?;/g, '');
typesContent = typesContent.replace(/export const mockSuperAdminUsers: SuperAdminUser\[\] = \[\];/g, '');
typesContent = typesContent.replace(/export const mockFinancialKPIs: FinancialKPIs[\s\S]*?;/g, '');
typesContent = typesContent.replace(/export const mockDashboardKPIs: DashboardKPIs[\s\S]*?;/g, '');
typesContent = typesContent.replace(/export const mockSupportTickets: SupportTicket\[\] = \[\];/g, '');
typesContent = typesContent.replace(/export const mockCriticalAlerts: CriticalAlert\[\] = \[\];/g, '');
typesContent = typesContent.replace(/export const mockTenants: Tenant\[\] = \[\];/g, '');
typesContent = typesContent.replace(/export const mockRevenueData: RevenueDataPoint\[\] = \[\];/g, '');
typesContent = typesContent.replace(/export const mockChurnData: ChurnDataPoint\[\] = \[\];/g, '');
typesContent = typesContent.replace(/export const mockActivityLog: ActivityLogItem\[\] = \[\];/g, '');
fs.writeFileSync(typesPath, typesContent, 'utf8');
console.log('Cleaned up super-admin-types.ts');

const adminStorePath = path.join(process.cwd(), 'src/stores/admin/admin-store.ts');
if (fs.existsSync(adminStorePath)) {
    let storeContent = fs.readFileSync(adminStorePath, 'utf8');
    // Update import path
    storeContent = storeContent.replace(/@\/lib\/super-admin-mock-data/g, '@/lib/super-admin-types');

    // Remove imported mock variables
    storeContent = storeContent.replace(/mockSuperAdminUsers,\s*/g, '');
    storeContent = storeContent.replace(/mockTenants,\s*/g, '');
    storeContent = storeContent.replace(/mockCriticalAlerts,\s*/g, '');
    storeContent = storeContent.replace(/mockSupportTickets,\s*/g, '');
    storeContent = storeContent.replace(/mockDashboardKPIs,\s*/g, '');
    storeContent = storeContent.replace(/mockFinancialKPIs,\s*/g, '');

    // Initialize variables directly instead of spreading mock data
    storeContent = storeContent.replace(/private superAdminUsers: SuperAdminUser\[\] = \[\.\.\.mockSuperAdminUsers\];/g, 'private superAdminUsers: SuperAdminUser[] = [];');
    storeContent = storeContent.replace(/private tenants: Tenant\[\] = \[\.\.\.mockTenants\];/g, 'private tenants: Tenant[] = [];');
    storeContent = storeContent.replace(/private alerts: CriticalAlert\[\] = \[\.\.\.mockCriticalAlerts\];/g, 'private alerts: CriticalAlert[] = [];');
    storeContent = storeContent.replace(/private tickets: SupportTicket\[\] = \[\.\.\.mockSupportTickets\];/g, 'private tickets: SupportTicket[] = [];');
    storeContent = storeContent.replace(/private dashboardKPIs: DashboardKPIs = \{ \.\.\.mockDashboardKPIs \};/g, 'private dashboardKPIs: DashboardKPIs = { totalTenants: 0, activeTenants: 0, overdueTenants: 0, suspendedTenants: 0, totalActiveUsers: 0, disconnectedWhatsapps: 0, criticalAlerts: 0 };');
    storeContent = storeContent.replace(/private financialKPIs: FinancialKPIs = \{ \.\.\.mockFinancialKPIs \};/g, 'private financialKPIs: FinancialKPIs = { mrr: 0, lastMonthRevenue: 0, currentMonthRevenue: 0, forecastedRevenue: 0, overdueAmount: 0, avgTicket: 0 };');

    fs.writeFileSync(adminStorePath, storeContent, 'utf8');
    console.log('Refactored admin-store.ts');
}

const superAdminPath = path.join(process.cwd(), 'src/pages/SuperAdmin.tsx');
if (fs.existsSync(superAdminPath)) {
    let saContent = fs.readFileSync(superAdminPath, 'utf8');
    saContent = saContent.replace(/@\/lib\/super-admin-mock-data/g, '@/lib/super-admin-types');
    fs.writeFileSync(superAdminPath, saContent, 'utf8');
    console.log('Refactored SuperAdmin imports');
}
