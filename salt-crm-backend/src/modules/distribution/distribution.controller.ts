import { Request, Response, NextFunction } from 'express';
import { distributionService } from './distribution.service.js';
import type {
    CreateDistributionRuleInput,
    UpdateDistributionRuleInput,
    DistributeLeadInput,
    ListDistributionRulesQuery,
    ListDistributionLogsQuery,
} from './distribution.schema.js';

class DistributionController {
    // Rules
    async findAllRules(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ListDistributionRulesQuery;
            const result = await distributionService.findAllRules(req.user!, query);
            res.json(result);
        } catch (error) { next(error); }
    }

    async findRuleById(req: Request, res: Response, next: NextFunction) {
        try {
            const rule = await distributionService.findRuleById(req.user!, req.params.id);
            res.json(rule);
        } catch (error) { next(error); }
    }

    async createRule(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CreateDistributionRuleInput;
            const rule = await distributionService.createRule(req.user!, data);
            res.status(201).json(rule);
        } catch (error) { next(error); }
    }

    async updateRule(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as UpdateDistributionRuleInput;
            const rule = await distributionService.updateRule(req.user!, req.params.id, data);
            res.json(rule);
        } catch (error) { next(error); }
    }

    async deleteRule(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await distributionService.deleteRule(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }

    // Distribution
    async distributeLead(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as DistributeLeadInput;
            const result = await distributionService.distributeLead(req.user!, data);
            res.status(201).json(result);
        } catch (error) { next(error); }
    }

    // Logs
    async findAllLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ListDistributionLogsQuery;
            const result = await distributionService.findAllLogs(req.user!, query);
            res.json(result);
        } catch (error) { next(error); }
    }
}

export const distributionController = new DistributionController();
