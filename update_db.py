import sqlite3
import os

db_path = 'voting_system.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        print("Column 'email' added successfully")
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
    conn.commit()
    conn.close()
else:
    print("Database not found")
