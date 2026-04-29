-- ============================================================
-- MBA-МАИ Manager · Supabase Schema
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'player'
                CHECK (role IN ('admin','head_coach','fitness_coach','medical','analyst','player')),
  player_id   UUID,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 'player');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── PLAYERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number       INT NOT NULL,
  full_name    TEXT NOT NULL,
  short_name   TEXT NOT NULL,
  position     TEXT NOT NULL CHECK (position IN ('PG','SG','SF','PF','C')),
  nationality  TEXT DEFAULT 'Россия',
  flag         TEXT DEFAULT '🇷🇺',
  age          INT,
  status       TEXT DEFAULT 'active'
                 CHECK (status IN ('active','injured','recovering','rest')),
  pts_avg      NUMERIC(4,1) DEFAULT 0,
  reb_avg      NUMERIC(4,1) DEFAULT 0,
  ast_avg      NUMERIC(4,1) DEFAULT 0,
  fg2_pct      INT DEFAULT 0,
  injury_note  TEXT,
  return_date  DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read players
CREATE POLICY "Auth users read players"
  ON players FOR SELECT TO authenticated USING (true);

-- Only admin/head_coach can modify
CREATE POLICY "Staff can modify players"
  ON players FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','head_coach')
  ));

-- ── RPE ENTRIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rpe_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_type   TEXT NOT NULL DEFAULT 'Тренировка',
  session_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  rpe            INT NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  duration_mins  INT NOT NULL DEFAULT 90,
  tl             INT GENERATED ALWAYS AS (rpe * duration_mins) STORED,
  comment        TEXT,
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rpe_entries ENABLE ROW LEVEL SECURITY;

-- Players can insert their own RPE
CREATE POLICY "Players insert own RPE"
  ON rpe_entries FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT player_id FROM profiles WHERE id = auth.uid() AND player_id IS NOT NULL
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid()
      AND role IN ('admin','head_coach','fitness_coach')
    )
  );

-- Staff see all, players see own
CREATE POLICY "Staff see all RPE"
  ON rpe_entries FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
      AND role IN ('admin','head_coach','fitness_coach','analyst'))
    OR player_id IN (
      SELECT player_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff update RPE"
  ON rpe_entries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','fitness_coach')
  ));

CREATE POLICY "Staff delete RPE"
  ON rpe_entries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','fitness_coach')
  ));

-- ── MEDICAL RECORDS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  diagnosis       TEXT NOT NULL,
  injury_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return DATE,
  status          TEXT DEFAULT 'active'
                    CHECK (status IN ('active','recovering','cleared')),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medical staff access records"
  ON medical_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','head_coach','medical')
  ));

-- ── STAFF ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name  TEXT NOT NULL,
  role_title TEXT NOT NULL,
  role       TEXT NOT NULL,
  color      TEXT DEFAULT 'blue',
  detail     TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins modify staff" ON staff FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── SEED: REAL MBA-MAI ROSTER ─────────────────────────────────
INSERT INTO players (number, full_name, short_name, position, nationality, flag, age, status, pts_avg, reb_avg, ast_avg, fg2_pct) VALUES
  (20, 'Андрей Зубков',       'Зубков',    'PF', 'Россия', '🇷🇺', 28, 'active',     14.4, 6.1, 2.5, 55),
  (1,  'Павел Савков',        'Савков',    'SG', 'Россия', '🇷🇺', 26, 'active',     10.9, 3.0, 2.2, 41),
  (11, 'Максим Барашков',     'Барашков',  'SF', 'Россия', '🇷🇺', 25, 'active',      9.0, 4.1, 1.0, 48),
  (16, 'Владислав Трушкин',   'Трушкин',   'SG', 'Россия', '🇷🇺', 27, 'active',      8.9, 4.6, 1.1, 39),
  (8,  'Вячеслав Зайцев',     'Зайцев',    'PG', 'Россия', '🇷🇺', 29, 'active',      8.7, 2.6, 4.1, 48),
  (6,  'Александр Гудумак',   'Гудумак',   'C',  'Россия', '🇷🇺', 30, 'injured',     8.1, 3.0, 1.1, 63),
  (95, 'Данил Певнев',        'Певнев',    'PF', 'Россия', '🇷🇺', 22, 'active',      6.5, 3.4, 0.4, 61),
  (28, 'Александр Платунов',  'Платунов',  'PG', 'Россия', '🇷🇺', 28, 'active',      6.3, 1.7, 3.9, 44),
  (18, 'Евгений Воронов',     'Воронов',   'SG', 'Россия', '🇷🇺', 26, 'active',      5.7, 1.9, 1.4, 39),
  (21, 'Сергей Балашов',      'Балашов',   'C',  'Россия', '🇷🇺', 31, 'active',      5.3, 3.1, 0.5, 55),
  (23, 'Максим Личутин',      'Личутин',   'SF', 'Россия', '🇷🇺', 24, 'active',      5.0, 1.4, 1.7, 40),
  (14, 'Паша Исмаилов',       'Исмаилов',  'PF', 'Россия', '🇷🇺', 23, 'active',      3.0, 2.8, 0.6, 48),
  (4,  'Артём Комолов',       'Комолов',   'PG', 'Россия', '🇷🇺', 21, 'active',      2.2, 0.6, 0.6, 48),
  (15, 'Матвей Падиус',       'Падиус',    'SG', 'Россия', '🇷🇺', 20, 'recovering',  2.1, 1.3, 0.6, 36),
  (0,  'Максим Огарков',      'Огарков',   'C',  'Россия', '🇷🇺', 22, 'active',      1.4, 1.3, 0.4, 50),
  (50, 'Клим Адайкин',        'Адайкин',   'C',  'Россия', '🇷🇺', 19, 'rest',        1.0, 0.0, 0.0, 100),
  (12, 'Тимофей Шикалов',     'Шикалов',   'PG', 'Россия', '🇷🇺', 19, 'rest',        0.0, 0.0, 0.0, 0)
ON CONFLICT DO NOTHING;

-- SEED: STAFF
INSERT INTO staff (full_name, role_title, role, color, detail, sort_order) VALUES
  ('Василий Карасёв',    'Главный тренер',               'head_coach',    'gold',   'Стаж в МБА: с 2021 · Чемпион Кубка России 2025/26', 1),
  ('Александр Афанасьев','Помощник главного тренера',    'head_coach',    'blue',   'Нападение · Стаж с 2022', 2),
  ('Сергей Вознюк',      'Помощник главного тренера',    'fitness_coach', 'blue',   'Защита и прессинг · экс-Зенит', 3),
  ('Евгений Сорокин',    'Тренер-скаут / видеоаналитик', 'analyst',       'purple', 'Видеоразбор · Трансферный скаутинг', 4),
  ('Дмитрий Некрасов',   'Врач команды',                 'medical',       'red',    'Спортивная медицина · МРТ-мониторинг', 5)
ON CONFLICT DO NOTHING;
