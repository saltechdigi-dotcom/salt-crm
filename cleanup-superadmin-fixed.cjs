const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/SuperAdmin.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The exact string block from SuperAdmin.tsx where these are imported:
// Just replace them exactly in the import block instead of everywhere
content = content.replace('mockCurrentSuperAdmin,', '');
content = content.replace('mockDashboardKPIs,', '');
content = content.replace('mockFinancialKPIs,', '');
content = content.replace('mockTenants,', '');
content = content.replace('mockSuperAdminUsers,', '');
content = content.replace('mockCriticalAlerts,', '');

// Now I will find the end of the import block and append the declarations
const declarations = `
// Fallback empty data to replace removed mocks
const mockTenants: any[] = [];
const mockSuperAdminUsers: any[] = [];
const mockCriticalAlerts: any[] = [];
const mockDashboardKPIs: any = { totalTenants: 0, activeTenants: 0, overdueTenants: 0, suspendedTenants: 0, totalActiveUsers: 0, disconnectedWhatsapps: 0, criticalAlerts: 0 };
const mockFinancialKPIs: any = { mrr: 0, lastMonthRevenue: 0, currentMonthRevenue: 0, forecastedRevenue: 0, overdueAmount: 0, avgTicket: 0 };
const mockCurrentSuperAdmin: any = { id: "", name: "Admin", email: "", role: "SUPER_ADMIN_MASTER", status: "ativo", lastLogin: "" };
`;

content = content.replace(/(from '@\/lib\/super-admin-types';)/, `$1\n${declarations}\n`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned SuperAdmin.tsx properly');
