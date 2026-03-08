import sqlite3
import os
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'voting_system.db')

def update_admin():
    username = 'SVPC'
    password = 'Svpc@25'
    hashed_password = generate_password_hash(password)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if admin already exists
        cursor.execute("SELECT id FROM admins WHERE username = ?", (username,))
        admin = cursor.fetchone()
        
        if admin:
            # Update existing admin
            cursor.execute("UPDATE admins SET password = ? WHERE id = ?", (hashed_password, admin[0]))
            print(f"Updated password for admin: {username}")
        else:
            # Create new admin if SVPC doesn't exist
            cursor.execute("INSERT INTO admins (username, password) VALUES (?, ?)", (username, hashed_password))
            print(f"Created new admin: {username}")
            
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_admin()
