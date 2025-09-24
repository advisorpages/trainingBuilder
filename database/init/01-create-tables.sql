-- Leadership Training App Database Schema
-- Initial table creation for brownfield integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Authentication Tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Tables (Existing/Brownfield)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ai_generated_content JSONB,
    learning_outcomes TEXT,
    trainer_notes TEXT,
    materials_needed TEXT,
    delivery_guidance TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic AI enhancement indexes
CREATE INDEX IF NOT EXISTS idx_topics_ai_content ON topics USING GIN (ai_generated_content);
CREATE INDEX IF NOT EXISTS idx_topics_learning_outcomes ON topics (learning_outcomes);
CREATE INDEX IF NOT EXISTS idx_topics_trainer_notes ON topics (trainer_notes);

-- Attribute Tables
CREATE TABLE IF NOT EXISTS audiences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('Broker', 'Basic user role with limited access'),
    ('Content Developer', 'Can create and manage training sessions'),
    ('Trainer', 'Can view assigned sessions and training materials')
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('app_name', 'Leadership Training App', 'Application name'),
    ('session_duration_default', '120', 'Default session duration in minutes'),
    ('max_registrations_per_session', '50', 'Maximum registrations allowed per session')
ON CONFLICT (key) DO NOTHING;

-- Insert sample data for development
INSERT INTO locations (name, address, capacity) VALUES
    ('Main Conference Room', '123 Business St, Suite 100', 30),
    ('Training Center A', '456 Learning Ave, Room 201', 20),
    ('Virtual Platform', 'Online via Zoom/Teams', 100)
ON CONFLICT DO NOTHING;

INSERT INTO trainers (name, email, bio) VALUES
    ('John Smith', 'john.smith@company.com', 'Senior Leadership Trainer with 10 years experience'),
    ('Sarah Johnson', 'sarah.johnson@company.com', 'Executive Coach specializing in team development'),
    ('Mike Chen', 'mike.chen@company.com', 'Professional Development Specialist')
ON CONFLICT DO NOTHING;

INSERT INTO topics (name, description) VALUES
    ('Leadership Fundamentals', 'Core principles of effective leadership'),
    ('Team Communication', 'Building better team communication skills'),
    ('Conflict Resolution', 'Managing and resolving workplace conflicts'),
    ('Strategic Planning', 'Long-term planning and execution strategies')
ON CONFLICT DO NOTHING;

INSERT INTO audiences (name, description) VALUES
    ('New Managers', 'Recently promoted managers'),
    ('Senior Leaders', 'Experienced leadership team'),
    ('All Employees', 'Company-wide training'),
    ('Department Heads', 'Department leadership team')
ON CONFLICT DO NOTHING;

INSERT INTO tones (name, description) VALUES
    ('Professional', 'Formal business tone'),
    ('Casual', 'Relaxed and approachable'),
    ('Inspiring', 'Motivational and uplifting'),
    ('Educational', 'Informative and instructional')
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, description) VALUES
    ('Leadership Development', 'Leadership skills and development'),
    ('Professional Skills', 'General professional development'),
    ('Team Building', 'Team collaboration and building'),
    ('Communication', 'Communication skills training')
ON CONFLICT DO NOTHING;
