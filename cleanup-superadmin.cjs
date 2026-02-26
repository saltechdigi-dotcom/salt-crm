const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/SuperAdmin.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove specific imports from super-admin-types
const importsToRemove = [
    'mockCurrentSuperAdmin',
    'mockDashboardKPIs',
    'mockFinancialKPIs',
    'mockTenants',
    'mockSuperAdminUsers',
    'mockCriticalAlerts',
];
importsToRemove.forEach(imp => {
    content = content.replace(new RegExp(`\\s*${imp},?`, 'g'), '');
});

// Replace usages with empty arrays/objects
content = content.replace(/\bmockTenants\b/g, '[]');
content = content.replace(/\bmockSuperAdminUsers\b/g, '[]');
content = content.replace(/\bmockCriticalAlerts\b/g, '[]');

content = content.replace(/\bmockDashboardKPIs\b/g, '{ totalTenants: 0, activeTenants: 0, overdueTenants: 0, suspendedTenants: 0, totalActiveUsers: 0, disconnectedWhatsapps: 0, criticalAlerts: 0 }');

content = content.replace(/\bmockFinancialKPIs\b/g, '{ mrr: 0, lastMonthRevenue: 0, currentMonthRevenue: 0, forecastedRevenue: 0, overdueAmount: 0, avgTicket: 0 }');

content = content.replace(/\bmockCurrentSuperAdmin\b/g, '{ id: "", name: "Admin", email: "", role: "SUPER_ADMIN_MASTER", status: "ativo", lastLogin: "" }');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned SuperAdmin.tsx mock usages');
