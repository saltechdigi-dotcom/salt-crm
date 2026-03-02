import cron from 'node-cron';
import { runFollowUpJob } from './follow-up.job.js';
import { runNpsJob } from './nps.job.js';
import { logger } from '../utils/logger.js';

/**
 * Initialize all cron jobs
 * Called once on server startup
 */
export function initCronJobs() {
    logger.info('[CRON] Initializing cron jobs...');

    // Follow-up job — every minute
    // Checks for leads waiting for response past their SLA
    cron.schedule('* * * * *', async () => {
        await runFollowUpJob();
    }, {
        timezone: 'America/Sao_Paulo',
    });
    logger.info('[CRON] ✅ Follow-up job scheduled (every 1 min)');

    // NPS job — every hour at minute 0
    // Checks for validated sales that need NPS surveys
    cron.schedule('0 * * * *', async () => {
        await runNpsJob();
    }, {
        timezone: 'America/Sao_Paulo',
    });
    logger.info('[CRON] ✅ NPS job scheduled (every hour)');

    logger.info('[CRON] All cron jobs initialized');
}
