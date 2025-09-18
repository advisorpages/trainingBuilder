-- Leadership Training App - Update User Passwords for Authentication Testing
-- Story 1.3: User Authentication

-- Update user passwords with bcrypt hashes for testing
-- Password for all test accounts: "Password123!"
-- Hash generated with bcrypt, 12 salt rounds

UPDATE users SET password_hash = '$2b$12$LQv3c1yqBwVHxkd0LHAkCOYz6TtxMpQd8j2F9G.SJhzP4vR8F.Gdu'
WHERE email IN (
    'sarah.content@company.com',
    'mike.creator@company.com',
    'john.trainer@company.com',
    'lisa.coach@company.com',
    'broker1@company.com',
    'broker2@company.com'
);

-- Add system setting to track password update
INSERT INTO system_settings (key, value, description) VALUES
    ('auth_passwords_updated', '1.3.0', 'User passwords updated for authentication testing')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Add auth system info
INSERT INTO system_settings (key, value, description) VALUES
    ('auth_system_version', '1.3.0', 'Authentication system implementation version'),
    ('default_test_password', 'Password123!', 'Default password for test accounts')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;