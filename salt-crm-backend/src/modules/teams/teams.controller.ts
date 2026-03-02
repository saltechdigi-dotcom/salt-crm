import { Request, Response, NextFunction } from 'express';
import { teamsService } from './teams.service.js';
import type { CreateTeamInput, UpdateTeamInput, AddMemberInput, ListTeamsQuery } from './teams.schema.js';

class TeamsController {
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ListTeamsQuery;
            const result = await teamsService.findAll(req.user!, query);
            res.json(result);
        } catch (error) { next(error); }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const team = await teamsService.findById(req.user!, req.params.id);
            res.json(team);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CreateTeamInput;
            const team = await teamsService.create(req.user!, data);
            res.status(201).json(team);
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as UpdateTeamInput;
            const team = await teamsService.update(req.user!, req.params.id, data);
            res.json(team);
        } catch (error) { next(error); }
    }

    async addMember(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as AddMemberInput;
            const team = await teamsService.addMember(req.user!, req.params.id, data);
            res.json(team);
        } catch (error) { next(error); }
    }

    async removeMember(req: Request, res: Response, next: NextFunction) {
        try {
            const team = await teamsService.removeMember(req.user!, req.params.id, req.params.userId);
            res.json(team);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await teamsService.delete(req.user!, req.params.id);
            res.json(result);
        } catch (error) { next(error); }
    }
}

export const teamsController = new TeamsController();
