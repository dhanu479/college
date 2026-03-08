import sqlite3
import os
from datetime import datetime

def migrate_database():
    # Get the database path
    BASE_DIR = os.path.dirname(__file__)
    DB_PATH = os.path.join(BASE_DIR, 'voting_system.db')
    
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Start a transaction
        conn.execute('BEGIN')
        
        # Create temporary table
        print("Creating temporary table...")
        cursor.execute('''
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                voter_id TEXT UNIQUE NOT NULL,
                aadhaar TEXT NOT NULL,
                phone_number TEXT NOT NULL DEFAULT '0000000000',
                country_code TEXT NOT NULL DEFAULT '+91',
                dob TEXT NOT NULL,
                face_image TEXT NOT NULL,
                face_encoding BLOB NOT NULL,
                has_voted INTEGER NOT NULL DEFAULT 0,
                voted_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Copy data from old table to new table
        print("Copying existing data...")
        cursor.execute('''
            INSERT INTO users_new (
                id, username, password, voter_id, aadhaar,
                dob, face_image, face_encoding, has_voted, created_at
            )
            SELECT id, username, password, voter_id, aadhaar,
                   dob, face_image, face_encoding, has_voted, created_at
            FROM users
        ''')
        
        # Drop old table
        print("Dropping old table...")
        cursor.execute('DROP TABLE users')
        
        # Rename new table
        print("Renaming new table...")
        cursor.execute('ALTER TABLE users_new RENAME TO users')
        
        # Commit the transaction
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        # If anything goes wrong, rollback the changes
        conn.rollback()
        print(f"Error during migration: {str(e)}")
        raise
    finally:
        # Close the connection
        conn.close()

if __name__ == '__main__':
    try:
        migrate_database()
    except Exception as e:
        print(f"Failed to migrate database: {str(e)}")
