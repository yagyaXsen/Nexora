"""
Database migration script to add community features columns
Run with: python migrate_community.py
"""

from app.database import engine
from sqlalchemy import text

def migrate_database():
    """Add missing columns to existing tables"""
    
    with engine.connect() as conn:
        try:
            print("🔄 Starting database migration...")
            
            # Add reputation_score and badges to user_profiles
            print("📝 Adding reputation_score to user_profiles...")
            try:
                conn.execute(text("""
                    ALTER TABLE user_profiles 
                    ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0
                """))
                conn.commit()
                print("✅ Added reputation_score column")
            except Exception as e:
                print(f"⚠️  reputation_score column: {e}")
            
            print("📝 Adding badges to user_profiles...")
            try:
                conn.execute(text("""
                    ALTER TABLE user_profiles 
                    ADD COLUMN IF NOT EXISTS badges JSON
                """))
                conn.commit()
                print("✅ Added badges column")
            except Exception as e:
                print(f"⚠️  badges column: {e}")
            
            print("\n✨ Migration complete!")
            print("🚀 Now run: python seed_community.py")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate_database()
