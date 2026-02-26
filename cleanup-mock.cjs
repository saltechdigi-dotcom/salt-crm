const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/pages/Dashboard.tsx',
    'src/pages/Outros.tsx',
    'src/components/ui/header.tsx',
    'src/components/reports/OperationalReport.tsx',
    'src/components/reports/FunnelStatusGrid.tsx',
    'src/components/notifications/HierarchicalNotifications.tsx',
    'src/components/chat/InlineConversationsPanel.tsx',
];

const mockVariablesToArray = [
    'mockKPIs', 'mockLeads', 'mockLeadsByOrigin', 'mockSalesByOrigin',
    'mockLeadsByPeriod', 'mockSalesByPeriod', 'mockPeriodDetailData',
    'mockAgentRanking', 'mockAgentRankingAtendimento', 'mockManagerRanking',
    'mockManagerRankingAtendimento', 'mockCombinedAgentRanking',
    'mockCombinedManagerRanking', 'mockCombinedOriginData', 'mockSalesData',
    'mockPipelineMainStages', 'mockPipelineExitStages', 'mockPipelineExitStagesLeft',
    'mockPipelineExitStagesRight', 'mockManagers', 'mockAgents', 'mockAIPrompts',
    'mockFollowUpMessages', 'mockTeams', 'mockVendedores', 'mockTeamUnreadMessages'
];

filesToProcess.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Remove multi-line import from mock-data
        content = content.replace(/import\s*\{[\s\S]*?\}\s*from\s*['"]@\/lib\/mock-data['"];/g, '');

        // Remove multi-line import from mockUser and mockTenant using different regex if standalone
        content = content.replace(/import\s*\{\s*(mockTenant|mockUser)(?:\s*,\s*(mockTenant|mockUser))?\s*\}\s*from\s*['"]@\/lib\/mock-data['"];/g, '');

        // Replace basic mock variables with empty arrays
        mockVariablesToArray.forEach(mockVar => {
            content = content.replace(new RegExp('\\b' + mockVar + '\\b', 'g'), '[]');
        });

        // Handle specific mock variables globally
        content = content.replace(/\bmockPipeline\b/g, '{ stages: [] }');
        content = content.replace(/\bmockUser\b/g, '{ name: "User", email: "", role: "user" }');
        content = content.replace(/\bmockTenant\b/g, '{ id: "", name: "Empresa", status: "ativo" }');
        content = content.replace(/\bmockCurrentUserRole\b/g, '"tenant_admin"');

        // Add empty definitions for mockSales if the import was removed in SalesReportExport
        // Just blindly replacing across files isn't perfect, but let's test

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Processed: ${filePath}`);
    }
});
