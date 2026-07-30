-- 003_clear_dummy_profile_defaults.sql
-- ==============================================
-- One-time manual migration: clear old dummy profile defaults
--
-- BEFORE (commit < 5dc90d0): The Profile model had hardcoded dummy
-- SQLAlchemy defaults for every text column. Auto-created profiles
-- (from Google sign-ups before the onboarding fix) stored these.
--
-- The startup.py function `_clear_dummy_profile_defaults()` does
-- the same thing programmatically, but runs only when the server
-- restarts with the new code. This SQL can be run directly against
-- the DB for an immediate fix.
--
-- Strategy: For each of the 5 known dummy strings, clear the field
-- (set to '') if it matches — but only on profiles where ≥2 fields
-- match (avoids false positives for real ETH Zurich students).
--
-- Applied: 2026-07-30
-- ==============================================

WITH affected AS (
  SELECT id FROM profiles
  WHERE (
    CASE WHEN academic_degree = 'Postdoctoral Research Fellow' THEN 1 ELSE 0 END +
    CASE WHEN institution = 'ETH Zurich' THEN 1 ELSE 0 END +
    CASE WHEN field_of_study = 'Computer Science & Artificial Intelligence' THEN 1 ELSE 0 END +
    CASE WHEN citizenship = 'Switzerland, India' THEN 1 ELSE 0 END +
    CASE WHEN residence = 'Zurich, Switzerland' THEN 1 ELSE 0 END
  ) >= 2
)
UPDATE profiles SET
  institution      = CASE WHEN institution      = 'ETH Zurich'                               THEN '' ELSE institution END,
  citizenship      = CASE WHEN citizenship      = 'Switzerland, India'                        THEN '' ELSE citizenship END,
  residence        = CASE WHEN residence        = 'Zurich, Switzerland'                       THEN '' ELSE residence END,
  academic_degree  = CASE WHEN academic_degree  = 'Postdoctoral Research Fellow'              THEN '' ELSE academic_degree END,
  field_of_study   = CASE WHEN field_of_study   = 'Computer Science & Artificial Intelligence' THEN '' ELSE field_of_study END
WHERE id IN (SELECT id FROM affected);
