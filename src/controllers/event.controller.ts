import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/event.service";
import { EventFilterQuery } from "../types/event.types";

export class EventController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: EventFilterQuery = {
        eventFormat: req.query.eventFormat as any,
        year: req.query.year ? Number(req.query.year) : undefined,
        status: req.query.status as any,
        language: req.query.language as any,
        search: req.query.search as string,
      };

      const events = await eventService.getAll(filters);
      res.json({
        success: true,
        count: events.length,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const event = await eventService.getByIdOrSlug(idOrSlug);

      if (!event) {
        res.status(404).json({
          success: false,
          message: `Evento com identificador '${idOrSlug}' não encontrado.`,
        });
        return;
      }

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newEvent = await eventService.create(req.body);
      res.status(201).json({
        success: true,
        message: "Evento criado com sucesso.",
        data: newEvent,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Erro ao criar evento.",
      });
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const updatedEvent = await eventService.update(idOrSlug, req.body);

      if (!updatedEvent) {
        res.status(404).json({
          success: false,
          message: `Evento com identificador '${idOrSlug}' não encontrado para atualização.`,
        });
        return;
      }

      res.json({
        success: true,
        message: "Evento atualizado com sucesso.",
        data: updatedEvent,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Erro ao atualizar evento.",
      });
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = String(req.params.idOrSlug);
      const deleted = await eventService.delete(idOrSlug);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `Evento com identificador '${idOrSlug}' não encontrado para exclusão.`,
        });
        return;
      }

      res.json({
        success: true,
        message: `Evento '${idOrSlug}' removido com sucesso.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();

