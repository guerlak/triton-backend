-- =============================================================================
-- TRITON WEB - MODELAGEM POSTGRESQL (schema.sql)
-- Baseado na estrutura de dados do eventData.ts
-- =============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE event_format_enum AS ENUM ('triton1', 'triton3');
CREATE TYPE event_status_enum AS ENUM ('Confirmed', 'Planned', 'Completed');
CREATE TYPE registration_status_enum AS ENUM ('Open', 'Closed', 'Hold');
CREATE TYPE discipline_type_enum AS ENUM ('swim', 'bike', 'run');

-- -----------------------------------------------------------------------------
-- TABELA PRINCIPAL: events
-- Armazena os dados nucleares e metadados de busca do evento
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id VARCHAR(100) PRIMARY KEY, -- Ex: 'salvador-2026', 'rio-2026' ou UUID
    slug VARCHAR(120) NOT NULL UNIQUE,
    language VARCHAR(10) NOT NULL DEFAULT 'pt-BR', -- 'pt-BR' ou 'en'
    event_format event_format_enum NOT NULL,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(200),
    location VARCHAR(200) NOT NULL,
    venue VARCHAR(255),
    date_text VARCHAR(50) NOT NULL,       -- Ex: "ABR 12", "AGO 21 . 22 . 23"
    full_date_text VARCHAR(100) NOT NULL,  -- Ex: "12 de Abril, 2026"
    target_date TIMESTAMPTZ NOT NULL,
    year INTEGER NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Brazil',
    flag VARCHAR(10) NOT NULL DEFAULT '🇧🇷',
    status event_status_enum NOT NULL DEFAULT 'Planned',
    registration_link TEXT NOT NULL DEFAULT '#',
    registration_status registration_status_enum DEFAULT 'Open',
    is_event_on BOOLEAN DEFAULT TRUE,
    is_registration_closed BOOLEAN DEFAULT FALSE,

    -- Hero Section
    hero_background_image TEXT,
    hero_logo_image TEXT,

    -- Seções de Conteúdo Institucional
    info_title VARCHAR(255),
    info_subtitle VARCHAR(255),
    info_description TEXT,

    scoring_title VARCHAR(255),
    scoring_description TEXT,

    -- Programação (Cabeçalho)
    schedule_title VARCHAR(255),
    schedule_subtitle VARCHAR(255),
    schedule_important_note TEXT,

    -- Localização & Experiência (Cabeçalho)
    locations_description TEXT,

    -- Informações extras / Aftermovie
    extra_event JSONB,     -- { imageSrc, imageAlt, title, subtitle, description, ctaText, ctaLink, badge }
    after_movie_url TEXT,  -- URL do YouTube

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices essenciais para consultas do frontend
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_year_format ON events(year, event_format);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_language ON events(language);

-- -----------------------------------------------------------------------------
-- TABELA: athlete_areas
-- Configurações e links da Área do Atleta de cada evento (1:1 com events)
-- -----------------------------------------------------------------------------
CREATE TABLE athlete_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    live_results_url TEXT,
    race_guide_link TEXT,
    start_list_api_url TEXT,
    media_picture_url TEXT,
    video_briefing_url TEXT,
    live_results_api_url TEXT,
    top_five_api_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_athlete_areas_event_id ON athlete_areas(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: event_formats (Disciplinas do TRITON 1 e TRITON 3)
-- Ex: Swim (Dia 1), Bike (Dia 2), Run (Dia 3)
-- -----------------------------------------------------------------------------
CREATE TABLE event_formats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    discipline discipline_type_enum NOT NULL, -- 'swim' | 'bike' | 'run'
    day_label VARCHAR(50) NOT NULL,           -- Ex: "Dia 1"
    date_label VARCHAR(50) NOT NULL,          -- Ex: "21 Ago (sexta)"
    start_time VARCHAR(20) NOT NULL,          -- Ex: "15:30"
    title VARCHAR(150) NOT NULL,              -- Ex: "Natação"
    description TEXT,
    extra_description TEXT,
    image_url TEXT,
    video_url TEXT,
    strava_id VARCHAR(100),
    strava_ids JSONB,                         -- Ex: { "sprint": "...", "middle": "...", "long": "..." }
    distances JSONB NOT NULL DEFAULT '[]',    -- Ex: [ { "label": "SPRINT", "val": "1.0 km", "p": 100 } ]
    details JSONB DEFAULT '[]',               -- Lista de strings ou itens informativos
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, discipline)
);

CREATE INDEX idx_event_formats_event_id ON event_formats(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: schedule_days (Dias do Cronograma do Evento)
-- -----------------------------------------------------------------------------
CREATE TABLE schedule_days (
    id VARCHAR(100) PRIMARY KEY, -- Ex: 'friday', 'saturday', ou UUID
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date_text VARCHAR(50) NOT NULL,   -- Ex: "21 Ago"
    title VARCHAR(100) NOT NULL,       -- Ex: "Sexta-feira"
    subtitle VARCHAR(150) NOT NULL,    -- Ex: "RACE DAY 1 - THE SWIM"
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_days_event_id ON schedule_days(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: schedule_events (Itens de cada dia da programação)
-- -----------------------------------------------------------------------------
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_day_id VARCHAR(100) NOT NULL REFERENCES schedule_days(id) ON DELETE CASCADE,
    time_text VARCHAR(50),            -- Ex: "15:30", "06:00 – 18:00"
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    is_cutoff BOOLEAN DEFAULT FALSE,
    details JSONB DEFAULT '[]',       -- Ex: [ { "label": "Largada", "value": "15:30" } ]
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_events_day_id ON schedule_events(schedule_day_id);

-- -----------------------------------------------------------------------------
-- TABELA: points_of_interest (POIs da Experiência Turística / Local)
-- -----------------------------------------------------------------------------
CREATE TABLE points_of_interest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    icon VARCHAR(50) NOT NULL,        -- Ex: "Compass", "Anchor", "Palmtree"
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_pois_event_id ON points_of_interest(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: logistics_items (Logística: Aeroportos, Acesso, Distâncias)
-- -----------------------------------------------------------------------------
CREATE TABLE logistics_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    icon VARCHAR(50) NOT NULL,        -- Ex: "Plane", "Car", "Navigation"
    title VARCHAR(100) NOT NULL,      -- Ex: "SSA Airport", "Acesso"
    detail VARCHAR(100) NOT NULL,     -- Ex: "25 km", "Metrô & Vias"
    sub VARCHAR(100) NOT NULL,        -- Ex: "~30min", "Estações Glória"
    color VARCHAR(100) NOT NULL,      -- Ex: "from-blue-500/20"
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_logistics_event_id ON logistics_items(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: resorts (Hospedagem / Hotel Oficial)
-- -----------------------------------------------------------------------------
CREATE TABLE resorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    benefits JSONB NOT NULL DEFAULT '[]', -- Array de strings com os benefícios
    button_text VARCHAR(50) NOT NULL DEFAULT 'Reservar',
    whatsapp_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resorts_event_id ON resorts(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: partners (Patrocinadores / Parceiros do Evento)
-- -----------------------------------------------------------------------------
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_partners_event_id ON partners(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: testimonials (Depoimentos de Atletas)
-- -----------------------------------------------------------------------------
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
    author VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    role VARCHAR(100),
    quote TEXT NOT NULL,
    avatar_url TEXT,
    social_link TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_testimonials_event_id ON testimonials(event_id);

-- -----------------------------------------------------------------------------
-- TABELA: users (Administradores e Colaboradores do Admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuário Admin padrão (admin@triton.com / admin123)
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'Administrador Triton',
    'admin@triton.com',
    '$2b$10$O./UceZPLH/6EVDBKS1nDOrv3JF2J9yDvlOAPSqy2Z7oVHyPqs9k.',
    'admin'
) ON CONFLICT (email) DO NOTHING;
