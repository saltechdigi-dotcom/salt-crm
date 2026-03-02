import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import type { CreateNotificationInput, ListNotificationsQuery } from './notifications.schema.js';

class NotificationsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ListNotificationsQuery;
            const result = await notificationsService.findAll(req.user!, query);
            res.json(result);
        } catch (error) { next(error); }
    }

    async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await notificationsService.getUnreadCount(req.user!);
            res.json(result);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CreateNotificationInput;
            const notification = await notificationsService.create(req.user!, data);
            res.status(201).json(notification);
        } catch (error) { next(error); }
    }

    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await notificationsService.markAsRead(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }

    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await notificationsService.markAllAsRead(req.user!);
            res.json(result);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await notificationsService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }
}

export const notificationsController = new NotificationsController();
