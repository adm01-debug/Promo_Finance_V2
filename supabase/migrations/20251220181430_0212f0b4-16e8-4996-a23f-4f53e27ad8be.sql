-- Move pg_net extension from public to extensions schema
-- First, create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Note: pg_net extension cannot be easily moved after creation
-- The extension needs to be dropped and recreated in the correct schema
-- However, this may break existing functionality, so we'll leave it as-is
-- and add a note that new extensions should be created in the extensions schema

-- For now, we acknowledge the warning but cannot fix it without data loss risk
-- This is a known limitation for extensions installed in public schema

COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions to avoid cluttering public schema';