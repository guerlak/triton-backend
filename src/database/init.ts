import fs from "fs";
import path from "path";
import { pool, query } from "../config/database";
import { initialEvents } from "../data/initialEvents";

async function initDatabase() {
  console.log("🔄 Iniciando configuração do banco PostgreSQL...");

  const schemaPath = path.resolve(__dirname, "../../database/schema.sql");
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Arquivo schema.sql não encontrado em: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  try {
    console.log("📦 Executando DDL (schema.sql)...");
    await pool.query(schemaSql);
    console.log("✅ Tabelas, índices e tipos criados com sucesso.");

    // Verificar se já existem eventos
    const check = await query("SELECT COUNT(*) AS total FROM events");
    const count = parseInt(check.rows[0].total, 10);

    if (count === 0) {
      console.log("🌱 Inserindo eventos iniciais (seed)...");

      for (const ev of initialEvents) {
        // Insere evento principal
        await query(
          `
          INSERT INTO events (
            id, slug, language, event_format, title, subtitle,
            location, venue, date_text, full_date_text, target_date,
            year, country, flag, status, registration_link,
            is_registration_closed, hero_background_image, hero_logo_image,
            info_title, info_subtitle, info_description,
            scoring_title, scoring_description, locations_description
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19,
            $20, $21, $22,
            $23, $24, $25
          ) ON CONFLICT (id) DO NOTHING
          `,
          [
            ev.id,
            ev.slug,
            ev.language || "pt-BR",
            ev.eventFormat,
            ev.title,
            ev.subtitle || null,
            ev.location,
            ev.venue || null,
            ev.dateText,
            ev.fullDateText,
            ev.targetDate,
            ev.year,
            ev.country || "Brazil",
            ev.flag || "🇧🇷",
            ev.status || "Planned",
            ev.registrationLink || "#",
            ev.isRegistrationClosed || false,
            ev.hero?.backgroundImage || null,
            ev.hero?.logoImage || null,
            ev.info?.title || null,
            ev.info?.subtitle || null,
            ev.info?.description || null,
            ev.scoring?.title || null,
            ev.scoring?.description || null,
            ev.locations?.description || null,
          ]
        );

        // Insere athleteArea se existir
        if (ev.athleteArea) {
          await query(
            `
            INSERT INTO athlete_areas (
              event_id, live_results_url, race_guide_link,
              start_list_api_url, media_picture_url, video_briefing_url,
              live_results_api_url, top_five_api_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (event_id) DO UPDATE SET
              live_results_url = EXCLUDED.live_results_url,
              race_guide_link = EXCLUDED.race_guide_link,
              start_list_api_url = EXCLUDED.start_list_api_url,
              media_picture_url = EXCLUDED.media_picture_url,
              video_briefing_url = EXCLUDED.video_briefing_url,
              live_results_api_url = EXCLUDED.live_results_api_url,
              top_five_api_url = EXCLUDED.top_five_api_url
            `,
            [
              ev.id,
              ev.athleteArea.liveResultsUrl || null,
              ev.athleteArea.raceGuideLink || null,
              ev.athleteArea.startListApiUrl || null,
              ev.athleteArea.mediaPictureUrl || null,
              ev.athleteArea.videoBriefingUrl || null,
              ev.athleteArea.liveResultsApiUrl || null,
              ev.athleteArea.topFiveApiUrl || null,
            ]
          );
        }

        // Insere modalidades se existirem
        if (ev.formats) {
          const disciplines: ("swim" | "bike" | "run")[] = ["swim", "bike", "run"];
          for (const d of disciplines) {
            const format = ev.formats[d];
            if (format) {
              await query(
                `
                INSERT INTO event_formats (
                  event_id, discipline, day_label, date_label,
                  start_time, title, description, image_url, distances
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (event_id, discipline) DO NOTHING
                `,
                [
                  ev.id,
                  d,
                  format.day,
                  format.date,
                  format.startTime,
                  format.title,
                  format.description || null,
                  format.image || null,
                  JSON.stringify(format.distances || []),
                ]
              );
            }
          }
        }

        // Insere resort se existir
        if (ev.locations?.resort) {
          const resort = ev.locations.resort;
          await query(
            `
            INSERT INTO resorts (
              event_id, title, description, image_url,
              benefits, button_text, whatsapp_link
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (event_id) DO NOTHING
            `,
            [
              ev.id,
              resort.title,
              resort.description,
              resort.image || null,
              JSON.stringify(resort.benefits || []),
              resort.buttonText || "Reservar",
              resort.whatsappLink || null,
            ]
          );
        }

        // Insere POIs se existirem
        if (ev.locations?.experience?.pois) {
          for (const [idx, poi] of ev.locations.experience.pois.entries()) {
            await query(
              `
              INSERT INTO points_of_interest (
                event_id, icon, title, description, order_index
              ) VALUES ($1, $2, $3, $4, $5)
              `,
              [ev.id, poi.icon, poi.title, poi.desc, idx]
            );
          }
        }

        // Insere logística se existir
        if (ev.locations?.logistics) {
          for (const [idx, log] of ev.locations.logistics.entries()) {
            await query(
              `
              INSERT INTO logistics_items (
                event_id, icon, title, detail, sub, color, order_index
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              `,
              [ev.id, log.icon, log.title, log.detail, log.sub, log.color, idx]
            );
          }
        }
      }

      console.log(`✅ Seed concluído com sucesso (${initialEvents.length} eventos inseridos).`);
    } else {
      console.log(`ℹ️ Banco de dados já contém ${count} eventos cadastrados.`);
    }

    console.log("🎉 Inicialização do banco concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao inicializar o banco de dados:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();

