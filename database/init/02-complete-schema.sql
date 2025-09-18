-- Leadership Training App - Complete Schema Implementation
-- Story 1.2: Database Schema & Roles

-- Feature Tables Implementation

-- Sessions table - Core training sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    qr_code_url TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    trainer_id INTEGER REFERENCES trainers(id) ON DELETE SET NULL,
    audience_id INTEGER REFERENCES audiences(id) ON DELETE SET NULL,
    tone_id INTEGER REFERENCES tones(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    max_registrations INTEGER DEFAULT 50,
    ai_prompt TEXT,
    ai_generated_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Topics join table (many-to-many)
CREATE TABLE IF NOT EXISTS session_topics (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, topic_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incentives table - Promotional incentives
CREATE TABLE IF NOT EXISTS incentives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rules TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'expired', 'cancelled')),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ai_generated_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registrations table - Session registrations
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    referred_by VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'retry')),
    sync_attempts INTEGER DEFAULT 0,
    external_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- Coaching Tips table - Reusable AI-generated coaching content
CREATE TABLE IF NOT EXISTS coaching_tips (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    category VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic Coaching Tips join table (many-to-many)
CREATE TABLE IF NOT EXISTS topic_coaching_tips (
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    tip_id INTEGER REFERENCES coaching_tips(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, tip_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_author ON sessions(author_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_location ON sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_registrations_session ON registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_sync_status ON registrations(sync_status);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at);

CREATE INDEX IF NOT EXISTS idx_incentives_status ON incentives(status);
CREATE INDEX IF NOT EXISTS idx_incentives_dates ON incentives(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_incentives_author ON incentives(author_id);
CREATE INDEX IF NOT EXISTS idx_incentives_active ON incentives(is_active);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_coaching_tips_category ON coaching_tips(category);
CREATE INDEX IF NOT EXISTS idx_coaching_tips_active ON coaching_tips(is_active);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incentives_updated_at BEFORE UPDATE ON incentives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_tips_updated_at BEFORE UPDATE ON coaching_tips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schema versioning
INSERT INTO system_settings (key, value, description) VALUES
    ('schema_version', '1.2.0', 'Current database schema version')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;