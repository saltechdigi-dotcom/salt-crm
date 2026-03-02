import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeSocket } from './config/socket.js';
import { initCronJobs } from './jobs/cron.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
    try {
        // Connect to database
        await connectDatabase();

        // Create HTTP server
        const httpServer = createServer(app);

        // Initialize Socket.io
        initializeSocket(httpServer);

        // Initialize cron jobs (follow-ups, NPS)
        initCronJobs();

        console.log('Server starting... salt-crm-backend');
        // Start server
        httpServer.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT}`);
            logger.info(`📍 Environment: ${env.NODE_ENV}`);
            logger.info(`🔗 API URL: ${env.API_URL}`);
            logger.info(`🔌 Socket.io ready`);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            httpServer.close(async () => {
                logger.info('HTTP server closed');
                await disconnectDatabase();
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcing shutdown');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
