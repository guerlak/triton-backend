import { query } from "../config/database";
import { EventData, EventFilterQuery } from "../types/event.types";

class EventService {
  /**
   * Lista eventos com filtros opcionais (suporta busca, formato, ano, status e idioma)
   */
  async getAll(filters?: EventFilterQuery): Promise<EventData[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.eventFormat) {
      values.push(filters.eventFormat);
      conditions.push(`e.event_format = $${values.length}`);
    }

    if (filters?.year) {
      values.push(Number(filters.year));
      conditions.push(`e.year = $${values.length}`);
    }

    if (filters?.status) {
      values.push(filters.status);
      conditions.push(`e.status = $${values.length}`);
    }

    if (filters?.language) {
      values.push(filters.language);
      conditions.push(`e.language = $${values.length}`);
    }

    if (filters?.search) {
      values.push(`%${filters.search.toLowerCase()}%`);
      const paramIndex = values.length;
      conditions.push(`(
        LOWER(e.title) LIKE $${paramIndex} OR
        LOWER(e.location) LIKE $${paramIndex} OR
        LOWER(e.country) LIKE $${paramIndex} OR
        LOWER(e.slug) LIKE $${paramIndex}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT 
        e.*,
        row_to_json(a.*) AS athlete_area,
        row_to_json(r.*) AS resort
      FROM events e
      LEFT JOIN athlete_areas a ON a.event_id = e.id
      LEFT JOIN resorts r ON r.event_id = e.id
      ${whereClause}
      ORDER BY e.target_date ASC
    `;

    const res = await query(sql, values);
    return res.rows.map(this.mapRowToEventData);
  }

  /**
   * Retorna um evento completo pelo id ou slug, incluindo formatos, cronograma e POIs
   */
  async getByIdOrSlug(idOrSlug: string): Promise<EventData | null> {
    const eventRes = await query(
      `
      SELECT 
        e.*,
        row_to_json(a.*) AS athlete_area,
        row_to_json(r.*) AS resort
      FROM events e
      LEFT JOIN athlete_areas a ON a.event_id = e.id
      LEFT JOIN resorts r ON r.event_id = e.id
      WHERE e.id = $1 OR e.slug = $1
      LIMIT 1
      `,
      [idOrSlug]
    );

    if (eventRes.rowCount === 0) {
      return null;
    }

    const event = this.mapRowToEventData(eventRes.rows[0]);

    // Buscar modalidades (Swim, Bike, Run)
    const formatsRes = await query(
      `SELECT * FROM event_formats WHERE event_id = $1 ORDER BY order_index ASC`,
      [event.id]
    );

    if (formatsRes.rowCount && formatsRes.rowCount > 0) {
      event.formats = event.formats || {};
      for (const row of formatsRes.rows) {
        const discipline = row.discipline as "swim" | "bike" | "run";
        event.formats[discipline] = {
          day: row.day_label,
          date: row.date_label,
          startTime: row.start_time,
          title: row.title,
          description: row.description,
          extraDescription: row.extra_description,
          image: row.image_url,
          video: row.video_url,
          stravaId: row.strava_id,
          stravaIds: row.strava_ids,
          distances: row.distances || [],
          details: row.details || [],
        };
      }
    }

    // Buscar Cronograma (Days + Events)
    const daysRes = await query(
      `SELECT * FROM schedule_days WHERE event_id = $1 ORDER BY order_index ASC`,
      [event.id]
    );

    if (daysRes.rowCount && daysRes.rowCount > 0) {
      const dayIds = daysRes.rows.map((d) => d.id);
      const eventsRes = await query(
        `SELECT * FROM schedule_events WHERE schedule_day_id = ANY($1) ORDER BY order_index ASC`,
        [dayIds]
      );

      const eventsByDay: Record<string, any[]> = {};
      for (const row of eventsRes.rows) {
        if (!eventsByDay[row.schedule_day_id]) {
          eventsByDay[row.schedule_day_id] = [];
        }
        eventsByDay[row.schedule_day_id].push({
          time: row.time_text,
          title: row.title,
          description: row.description,
          location: row.location,
          isCutoff: row.is_cutoff,
          details: row.details,
        });
      }

      event.schedule = {
        title: eventRes.rows[0].schedule_title || "Programação Oficial",
        subtitle: eventRes.rows[0].schedule_subtitle || "",
        importantNote: eventRes.rows[0].schedule_important_note || "",
        days: daysRes.rows.map((d) => ({
          id: d.id,
          date: d.date_text,
          title: d.title,
          subtitle: d.subtitle,
          events: eventsByDay[d.id] || [],
        })),
      };
    }

    // Buscar POIs (Experiência) e Logística
    const poisRes = await query(
      `SELECT * FROM points_of_interest WHERE event_id = $1 ORDER BY order_index ASC`,
      [event.id]
    );

    const logisticsRes = await query(
      `SELECT * FROM logistics_items WHERE event_id = $1 ORDER BY order_index ASC`,
      [event.id]
    );

    if (event.locations || (poisRes.rowCount && poisRes.rowCount > 0) || (logisticsRes.rowCount && logisticsRes.rowCount > 0)) {
      event.locations = {
        description: eventRes.rows[0].locations_description || "",
        experience: {
          image: "",
          pois: (poisRes.rows || []).map((p) => ({
            icon: p.icon,
            title: p.title,
            desc: p.description,
          })),
        },
        logistics: (logisticsRes.rows || []).map((l) => ({
          icon: l.icon,
          title: l.title,
          detail: l.detail,
          sub: l.sub,
          color: l.color,
        })),
        resort: event.locations?.resort,
      };
    }

    return event;
  }

  /**
   * Criação de um novo evento
   */
  async create(payload: Partial<EventData>): Promise<EventData> {
    if (!payload.title) {
      throw new Error("O campo 'title' é obrigatório.");
    }

    const slug =
      payload.slug ||
      payload.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const id = payload.id || slug;

    const sql = `
      INSERT INTO events (
        id, slug, language, event_format, title, subtitle,
        location, venue, date_text, full_date_text, target_date,
        year, country, flag, status, registration_link,
        registration_status, is_event_on, is_registration_closed,
        hero_background_image, hero_logo_image,
        info_title, info_subtitle, info_description,
        scoring_title, scoring_description, locations_description
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19,
        $20, $21,
        $22, $23, $24,
        $25, $26, $27
      )
      RETURNING *
    `;

    const values = [
      id,
      slug,
      payload.language || "pt-BR",
      payload.eventFormat || "triton1",
      payload.title,
      payload.subtitle || null,
      payload.location || "",
      payload.venue || null,
      payload.dateText || "",
      payload.fullDateText || "",
      payload.targetDate || new Date().toISOString(),
      payload.year || new Date().getFullYear(),
      payload.country || "Brazil",
      payload.flag || "🇧🇷",
      payload.status || "Planned",
      payload.registrationLink || "#",
      payload.registrationStatus || "Open",
      payload.isEventOn ?? true,
      payload.isRegistrationClosed ?? false,
      payload.hero?.backgroundImage || null,
      payload.hero?.logoImage || null,
      payload.info?.title || null,
      payload.info?.subtitle || null,
      payload.info?.description || null,
      payload.scoring?.title || null,
      payload.scoring?.description || null,
      payload.locations?.description || null,
    ];

    const res = await query(sql, values);
    return this.mapRowToEventData(res.rows[0]);
  }

  /**
   * Atualização de um evento existente
   */
  async update(idOrSlug: string, updates: Partial<EventData>): Promise<EventData | null> {
    const existing = await query("SELECT id FROM events WHERE id = $1 OR slug = $1", [idOrSlug]);
    if (existing.rowCount === 0) {
      return null;
    }

    const eventId = existing.rows[0].id;
    const setClauses: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      title: "title",
      subtitle: "subtitle",
      location: "location",
      venue: "venue",
      dateText: "date_text",
      fullDateText: "full_date_text",
      targetDate: "target_date",
      year: "year",
      country: "country",
      flag: "flag",
      status: "status",
      registrationLink: "registration_link",
      registrationStatus: "registration_status",
      isEventOn: "is_event_on",
      isRegistrationClosed: "is_registration_closed",
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((updates as any)[key] !== undefined) {
        values.push((updates as any)[key]);
        setClauses.push(`${col} = $${values.length}`);
      }
    }

    if (updates.hero?.backgroundImage !== undefined) {
      values.push(updates.hero.backgroundImage);
      setClauses.push(`hero_background_image = $${values.length}`);
    }

    if (updates.hero?.logoImage !== undefined) {
      values.push(updates.hero.logoImage);
      setClauses.push(`hero_logo_image = $${values.length}`);
    }

    if (setClauses.length > 0) {
      setClauses.push("updated_at = NOW()");
      values.push(eventId);
      const sql = `UPDATE events SET ${setClauses.join(", ")} WHERE id = $${values.length}`;
      await query(sql, values);
    }

    return this.getByIdOrSlug(eventId);
  }

  /**
   * Exclusão de evento
   */
  async delete(idOrSlug: string): Promise<boolean> {
    const res = await query("DELETE FROM events WHERE id = $1 OR slug = $1", [idOrSlug]);
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Utilitário para mapear linhas do PostgreSQL para a interface EventData
   */
  private mapRowToEventData(row: any): EventData {
    const data: EventData = {
      id: row.id,
      slug: row.slug,
      language: row.language,
      eventFormat: row.event_format,
      title: row.title,
      subtitle: row.subtitle || "",
      location: row.location,
      venue: row.venue || "",
      dateText: row.date_text,
      fullDateText: row.full_date_text,
      targetDate: row.target_date ? new Date(row.target_date).toISOString() : "",
      year: row.year,
      country: row.country,
      flag: row.flag,
      status: row.status,
      registrationLink: row.registration_link,
      registrationStatus: row.registration_status,
      isEventOn: row.is_event_on,
      isRegistrationClosed: row.is_registration_closed,
      hero: {
        backgroundImage: row.hero_background_image || "",
        logoImage: row.hero_logo_image || "",
      },
    };

    if (row.info_title || row.info_description) {
      data.info = {
        title: row.info_title || "",
        subtitle: row.info_subtitle || "",
        description: row.info_description || "",
      };
    }

    if (row.scoring_title || row.scoring_description) {
      data.scoring = {
        title: row.scoring_title || "",
        description: row.scoring_description || "",
      };
    }

    if (row.athlete_area) {
      data.athleteArea = {
        liveResultsUrl: row.athlete_area.live_results_url || undefined,
        raceGuideLink: row.athlete_area.race_guide_link || undefined,
        startListApiUrl: row.athlete_area.start_list_api_url || undefined,
        mediaPictureUrl: row.athlete_area.media_picture_url || undefined,
        videoBriefingUrl: row.athlete_area.video_briefing_url || undefined,
        liveResultsApiUrl: row.athlete_area.live_results_api_url || undefined,
        topFiveApiUrl: row.athlete_area.top_five_api_url || undefined,
      };
    }

    if (row.resort) {
      data.locations = {
        description: row.locations_description || "",
        experience: { image: "", pois: [] },
        logistics: [],
        resort: {
          image: row.resort.image_url || "",
          title: row.resort.title,
          description: row.resort.description,
          benefits: typeof row.resort.benefits === "string" ? JSON.parse(row.resort.benefits) : row.resort.benefits || [],
          buttonText: row.resort.button_text || "Reservar",
          whatsappLink: row.resort.whatsapp_link || "",
        },
      };
    }

    return data;
  }
}

export const eventService = new EventService();
