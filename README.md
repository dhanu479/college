# SecureVote (Flask)

Features:
- Single-face recognition with `face_recognition`
- One user = one vote (DB UNIQUE constraint + flag)
- Liveness: Blink (EAR drop), head movement (left/right yaw proxy)
- Anti-spoof: color saturation/variance, texture entropy, blur check
- Basic admin to add candidates & view stats

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Initialize DB
python -c "import sqlite3; import pathlib; p='voting_system.db'; c=sqlite3.connect(p); c.executescript(open('schema.sql').read()); c.execute('INSERT INTO admins(username,password) VALUES (?,?)', ('admin', __import__('werkzeug.security').security.generate_password_hash('admin123'))); c.execute('INSERT INTO candidates(name,party) VALUES (?,?)', ('Alice','Alpha')); c.execute('INSERT INTO candidates(name,party) VALUES (?,?)', ('Bob','Beta')); c.commit(); c.close(); print('DB initialized as', p)"
```

Run the app:
```bash
python app.py
```

Open: http://127.0.0.1:5000

Admin login: `admin` / `admin123` (change in production).
