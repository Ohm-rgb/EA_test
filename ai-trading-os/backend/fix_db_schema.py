import sqlite3
import os

DB_PATH = "backend/dev.db"

def fix_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found. Skipping.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(settings)")
    columns = [info[1] for info in cursor.fetchall()]
    
    new_columns = {
        "local_ai_model": "VARCHAR(50) DEFAULT 'qwen3:8b'",
        "external_ai_provider": "VARCHAR(20) DEFAULT 'gemini'",
        "external_ai_model": "VARCHAR(50) DEFAULT 'gemini-2.5-flash'",
        "primary_ai_provider": "VARCHAR(20) DEFAULT 'ollama'",
        "external_ai_status": "VARCHAR(20) DEFAULT 'not_tested'",
        "external_ai_last_checked": "DATETIME",
        "external_ai_error": "VARCHAR(255)"
    }
    
    try:
        for col, dtype in new_columns.items():
            if col not in columns:
                print(f"Adding missing column: {col}")
                cursor.execute(f"ALTER TABLE settings ADD COLUMN {col} {dtype}")
        
        conn.commit()
        print("Database schema updated successfully.")
    except Exception as e:
        print(f"Error updating schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
