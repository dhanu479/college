import sqlite3
import os

def check_schema():
    BASE_DIR = os.path.dirname(__file__)
    DB_PATH = os.path.join(BASE_DIR, 'voting_system.db')
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get table info
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("\nCurrent users table schema:")
        print("-" * 50)
        for col in columns:
            print(f"Column: {col[1]}")
            print(f"Type: {col[2]}")
            print(f"Not Null: {bool(col[3])}")
            print(f"Default Value: {col[4]}")
            print("-" * 50)
            
    finally:
        conn.close()

if __name__ == '__main__':
    check_schema()
