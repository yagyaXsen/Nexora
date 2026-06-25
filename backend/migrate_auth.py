"""
Database migration for Phase 1 authentication.
Creates the `users` table and links `user_profiles.user_id` -> users.id.
Idempotent — safe to run multiple times.

Run with: python migrate_auth.py
"""

from app.database import engine
from sqlalchemy import text


def migrate_database():
    with engine.connect() as conn:
        try:
            print("🔄 Starting auth migration...")

            # 1. users table
            print("📝 Creating users table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255),
                    password_hash VARCHAR(255) NOT NULL,
                    is_active VARCHAR(10) DEFAULT 'Yes',
                    created_at TIMESTAMPTZ DEFAULT now()
                )
            """))
            conn.commit()
            print("✅ users table ready")

            print("📝 Indexing users.email...")
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)
            """))
            conn.commit()
            print("✅ users.email index ready")

            # 2. user_profiles.user_id FK
            print("📝 Adding user_id to user_profiles...")
            conn.execute(text("""
                ALTER TABLE user_profiles
                ADD COLUMN IF NOT EXISTS user_id INTEGER
            """))
            conn.commit()

            # Add the FK constraint + unique only if not already present.
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_profiles_user_id'
                    ) THEN
                        ALTER TABLE user_profiles
                        ADD CONSTRAINT fk_user_profiles_user_id
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
                    END IF;
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_profiles_user_id'
                    ) THEN
                        ALTER TABLE user_profiles
                        ADD CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id);
                    END IF;
                END $$;
            """))
            conn.commit()
            print("✅ user_profiles.user_id ready")

            print("\n✨ Auth migration complete!")
            print("🚀 Start the API: uvicorn app.main:app --reload  (then POST /api/auth/register)")

        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()


if __name__ == "__main__":
    migrate_database()
