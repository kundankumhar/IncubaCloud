CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','mentor','founder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','upcoming','completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  founder_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  stage VARCHAR(40) NOT NULL DEFAULT 'Idea',
  status VARCHAR(30) NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review','Accepted','In Progress','Graduated','Rejected')),
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_startups_status ON startups(status);
CREATE INDEX IF NOT EXISTS idx_startups_program ON startups(program_id);
CREATE INDEX IF NOT EXISTS idx_milestones_startup ON milestones(startup_id);

INSERT INTO programs (name, description, status, start_date, end_date)
SELECT 'LaunchPad Accelerator', 'A 12-week program for early-stage founders to validate, build and launch.', 'active', CURRENT_DATE - 20, CURRENT_DATE + 64
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'LaunchPad Accelerator');
INSERT INTO programs (name, description, status, start_date, end_date)
SELECT 'Women in Innovation', 'Mentorship and resources for women-led ventures.', 'upcoming', CURRENT_DATE + 15, CURRENT_DATE + 105
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Women in Innovation');
INSERT INTO programs (name, description, status, start_date, end_date)
SELECT 'Digital Futures Cohort', 'A completed cohort focused on digital-first business models.', 'completed', CURRENT_DATE - 180, CURRENT_DATE - 60
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = 'Digital Futures Cohort');

INSERT INTO startups (name, founder_name, email, sector, stage, status, program_id)
SELECT 'GreenRoute', 'Aarav Sharma', 'aarav@example.com', 'CleanTech', 'MVP', 'In Progress', id FROM programs WHERE name='LaunchPad Accelerator'
AND NOT EXISTS (SELECT 1 FROM startups WHERE name='GreenRoute');
INSERT INTO startups (name, founder_name, email, sector, stage, status, program_id)
SELECT 'MediBridge', 'Isha Verma', 'isha@example.com', 'HealthTech', 'Prototype', 'Accepted', id FROM programs WHERE name='LaunchPad Accelerator'
AND NOT EXISTS (SELECT 1 FROM startups WHERE name='MediBridge');
INSERT INTO startups (name, founder_name, email, sector, stage, status, program_id)
SELECT 'SkillSpring', 'Kabir Mehta', 'kabir@example.com', 'EdTech', 'Idea', 'Under Review', id FROM programs WHERE name='Women in Innovation'
AND NOT EXISTS (SELECT 1 FROM startups WHERE name='SkillSpring');
INSERT INTO startups (name, founder_name, email, sector, stage, status, program_id)
SELECT 'FarmSense', 'Ananya Rao', 'ananya@example.com', 'AgriTech', 'Growth', 'Graduated', id FROM programs WHERE name='Digital Futures Cohort'
AND NOT EXISTS (SELECT 1 FROM startups WHERE name='FarmSense');

INSERT INTO milestones (startup_id, title, due_date, completed)
SELECT s.id, 'Validate customer problem', CURRENT_DATE + 7, TRUE FROM startups s WHERE s.name='GreenRoute'
AND NOT EXISTS (SELECT 1 FROM milestones m WHERE m.startup_id=s.id AND m.title='Validate customer problem');
INSERT INTO milestones (startup_id, title, due_date, completed)
SELECT s.id, 'Launch MVP beta', CURRENT_DATE + 21, FALSE FROM startups s WHERE s.name='GreenRoute'
AND NOT EXISTS (SELECT 1 FROM milestones m WHERE m.startup_id=s.id AND m.title='Launch MVP beta');
