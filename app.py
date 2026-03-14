
import os
import uuid
import sqlite3
import traceback
from datetime import datetime, timedelta

import random
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import requests
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

import numpy as np
import cv2
import face_recognition
from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# --------------------- Email Config ---------------------
# Set inside .env file in root directory!
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465

def send_email(receiver_email, subject, body_html):
    # Fetch from .env
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'securevote.alerts@gmail.com')
    SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')

    if not SENDER_PASSWORD or "your_16_digit_app_password_here" in SENDER_PASSWORD:
        print(f"SKIPPING EMAIL (Unconfigured): Add a valid Google App Password to .env to send to {receiver_email}")
        return False

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SENDER_EMAIL
        message["To"] = receiver_email

        part1 = MIMEText(body_html, "html")
        message.attach(part1)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
            try:
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                server.sendmail(SENDER_EMAIL, receiver_email, message.as_string())
                print(f"Email sent successfully to {receiver_email}")
                return True
            except smtplib.SMTPAuthenticationError:
                print(f"AUTH ERROR: Could not login to {SENDER_EMAIL}. Check App Password.")
                return False
            except Exception as e:
                print(f"SMTP ERROR: {e}")
                return False
    except Exception as e:
        print(f"Failed to prepare email: {e}")
        return False

# --------------------- Real SMS Setup ---------------------
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
FAST2SMS_API_KEY = os.getenv('FAST2SMS_API_KEY')
MSG91_AUTH_KEY = os.getenv('MSG91_AUTH_KEY')
MSG91_WIDGET_ID = os.getenv('MSG91_WIDGET_ID')

def send_real_sms(to_number, otp_code):
    success = False
    
    # Clean phone number (remove +, spaces, dashes)
    clean_no = to_number.replace("+", "").replace(" ", "").replace("-", "")
    
    # 1. Try MSG91 (Best for reliability and Widget support)
    if MSG91_AUTH_KEY and "your_" not in MSG91_AUTH_KEY:
        url = "https://control.msg91.com/api/v5/otp"
        querystring = {
            "mobile": clean_no,
            "authkey": MSG91_AUTH_KEY,
            "otp": otp_code
        }
        # Only add widget_id if it's set
        if MSG91_WIDGET_ID:
            querystring["widget_id"] = MSG91_WIDGET_ID
        headers = {'Content-Type': "application/json"}
        try:
            response = requests.get(url, params=querystring, headers=headers)
            res_data = response.json()
            print("MSG91 Response:", res_data)
            if res_data.get('type') == 'success':
                return True
            else:
                print("MSG91 failed:", res_data)
        except Exception as e:
            print("MSG91 Error:", e)

    # 2. Try Fast2SMS (Backup for India)
    if FAST2SMS_API_KEY and "your_fast2sms" not in FAST2SMS_API_KEY:
        # Fast2SMS expects 10 digits for India
        india_no = clean_no[-10:] if len(clean_no) >= 10 else clean_no
        url = "https://www.fast2sms.com/dev/bulkV2"
        querystring = {"authorization":FAST2SMS_API_KEY, "variables_values":otp_code, "route":"otp", "numbers":india_no}
        headers = {'cache-control': "no-cache"}
        try:
            response = requests.request("GET", url, headers=headers, params=querystring)
            print("Fast2SMS Response:", response.text)
            res_json = response.json()
            if res_json.get('return') is True or res_json.get('status_code') == 200:
                return True
            else:
                print("Fast2SMS failed:", res_json)
        except Exception as e:
            print("Fast2SMS Error:", e)

    # 3. Fallback to Twilio
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        if "your_account_sid" not in TWILIO_ACCOUNT_SID:
            try:
                client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                message = client.messages.create(
                    body=f"Your SecureVote verification OTP is: {otp_code}. Do not share this API code with anyone.",
                    from_=TWILIO_PHONE_NUMBER,
                    to=to_number
                )
                print("Twilio sent SMS. SID:", message.sid)
                return True
            except Exception as e:
                print("Twilio SMS Error:", e)
    
    return False

# --------------------- App Config ---------------------
app = Flask(__name__)
# Use a fixed secret key from env, or a stable fallback (do NOT use os.urandom — kills sessions on restart)
app.secret_key = os.getenv('SECRET_KEY', 'securevote-stable-secret-key-2026-change-in-production')
app.permanent_session_lifetime = timedelta(minutes=30)

BASE_DIR = os.path.dirname(__file__)
app.config.update(
    UPLOAD_FOLDER=os.path.join(BASE_DIR, 'static', 'uploads'),
    FACE_FOLDER=os.path.join(BASE_DIR, 'static', 'faces'),
    DATABASE=os.path.join(BASE_DIR, 'voting_system.db'),
    ALLOWED_EXTENSIONS={'png', 'jpg', 'jpeg'},
    MAX_CONTENT_LENGTH=5 * 1024 * 1024,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'logos'), exist_ok=True)
os.makedirs(app.config['FACE_FOLDER'], exist_ok=True)

# --------------------- Helpers ---------------------
def get_db():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def process_image_from_filestorage(file_storage):
    try:
        file_bytes = np.asarray(bytearray(file_storage.read()), dtype=np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            return None
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = rgb.shape[:2]
        if max(h, w) > 1000:
            scale = 1000 / max(h, w)
            rgb = cv2.resize(rgb, (0, 0), fx=scale, fy=scale)
        return rgb
    except Exception:
        return None

def single_face_encoding(rgb_img):
    # Enforce exactly one face
    boxes = face_recognition.face_locations(rgb_img, model="hog")
    if len(boxes) != 1:
        return None, len(boxes)
    enc = face_recognition.face_encodings(rgb_img, boxes)[0]
    return enc, 1

# ---------- Liveness: Blink (EAR), Head Turn (yaw-ish), Color/Texture ---------
def eye_aspect_ratio(eye_points):
    # eye_points: list of 6 (x,y) for one eye
    # EAR = (||p2-p6|| + ||p3-p5||) / (2||p1-p4||)
    p = np.array(eye_points, dtype=np.float32)
    def dist(a, b): return np.linalg.norm(p[a] - p[b])
    return (dist(1, 5) + dist(2, 4)) / (2.0 * dist(0, 3) + 1e-6)

def landmarks_68(rgb_img):
    lm = face_recognition.face_landmarks(rgb_img)
    if not lm or len(lm) != 1:  # exactly one face
        return None
    return lm[0]

def compute_yaw_proxy(lm):
    # Use ratio of nose bridge/point to eye centers to infer left/right head turn
    left_eye = np.mean(np.array(lm['left_eye']), axis=0)
    right_eye = np.mean(np.array(lm['right_eye']), axis=0)
    nose_bridge = np.mean(np.array(lm['nose_bridge']), axis=0)
    eyes_mid = (left_eye + right_eye) / 2.0
    # positive x means nose is to right of midline (user turned left), negative x -> turned right
    return float(nose_bridge[0] - eyes_mid[0])

def blink_detect(base_lm, blink_lm):
    # Compute EAR change between baseline and blink frame
    def eye_ear(lm, key):
        return eye_aspect_ratio(lm[key])
    base_ear = (eye_ear(base_lm, 'left_eye') + eye_ear(base_lm, 'right_eye')) / 2.0
    new_ear = (eye_ear(blink_lm, 'left_eye') + eye_ear(blink_lm, 'right_eye')) / 2.0
    # a blink causes EAR to drop significantly
    return base_ear - new_ear  # expect > threshold

def color_texture_checks(rgb_img):
    # Saturation/Colorfulness: reject grayscale or low color variance
    hsv = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2HSV)
    sat = hsv[:,:,1].astype(np.float32)
    mean_sat = float(np.mean(sat))
    std_sat = float(np.std(sat))

    # Sharpness via Laplacian variance (too low -> blurred spoof)
    gray = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2GRAY)
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    # Simple texture richness: grayscale entropy proxy
    hist = cv2.calcHist([gray],[0],None,[256],[0,256]).ravel()
    hist = hist / (np.sum(hist) + 1e-9)
    entropy = float(-np.sum(hist * np.log2(hist + 1e-9)))

    return {
        'mean_sat': mean_sat,
        'std_sat': std_sat,
        'lap_var': lap_var,
        'entropy': entropy
    }

def liveness_eval(base_img):
    # Ensure single face
    enc, count = single_face_encoding(base_img)
    if enc is None:
        return False, "Make sure only one face is visible.", {}

    # Landmarks
    base_lm = landmarks_68(base_img)

    # Color/texture on base image
    ct = color_texture_checks(base_img)
    color_ok = (ct['mean_sat'] > 18.0 and ct['std_sat'] > 8.0)
    sharp_ok = ct['lap_var'] > 45.0
    entropy_ok = ct['entropy'] > 5.6

    reason = ""
    if not color_ok: reason += "Low color saturation. "
    if not sharp_ok: reason += "Image too blurry. "
    if not entropy_ok: reason += "Low texture detail. "
    
    if not (color_ok and sharp_ok and entropy_ok):
        return False, reason, ct
        
    return True, "Liveness check passed.", ct
   
# --------------------- Routes ---------------------
@app.route('/test-it')
def test_it():
    return "SERVER IS UPDATED AND RUNNING"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/features')
def features():
    return render_template('features.html')

@app.route('/how-it-works')
def how_it_works():
    return render_template('how_it_works.html')

@app.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy_policy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/help')
def help():
    return render_template('help.html')

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        try:
            first_name = request.form.get('first_name', '').strip()
            last_name = request.form.get('last_name', '').strip()
            password = request.form.get('password','')
            email = request.form.get('email','').strip()
            uucms_number = request.form.get('uucms_number','').strip()
            otp_method = request.form.get('otp_method', 'email')
            dob_str  = request.form.get('dob','').strip()
            face_img = request.files.get('face_image')

            if not all([first_name, last_name, password, email, uucms_number, dob_str, face_img]):
                flash("All fields are required.", "danger")
                return render_template('register.html', datetime=datetime)

            if not allowed_file(face_img.filename):
                flash("Only JPG/PNG allowed.", "danger")
                return render_template('register.html', datetime=datetime)

            # Age >= 18
            dob = datetime.strptime(dob_str, '%Y-%m-%d')
            today = datetime.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 18:
                flash("You must be at least 18 years old to vote.", "danger")
                return render_template('register.html', datetime=datetime)

            # Basic UUCMS Number Validation (adjust regex if you have a strict format)
            if not len(uucms_number) > 3:
                flash("Please enter a valid UUCMS Number.", "danger")
                return render_template('register.html', datetime=datetime)

            # Validate phone number
            phone_number = request.form.get('phone_number', '').strip()
            country_code = request.form.get('country_code', '').strip()
            if not phone_number.isdigit() or len(phone_number) != 10:
                flash("Please enter a valid 10-digit phone number.", "danger")
                return render_template('register.html', datetime=datetime)



            # Check for uniqueness of all fields
            conn = get_db()
            existing = conn.execute("""
                SELECT uucms_number, email, phone_number 
                FROM users 
                WHERE uucms_number = ? OR email = ? OR phone_number = ?
            """, (uucms_number, email, phone_number)).fetchall()
            
            if existing:
                for row in existing:
                    if row['uucms_number'] == uucms_number:
                        flash("UUCMS Number already exists.", "danger")
                    elif row['email'] == email:
                        flash("Email address is already registered.", "danger")
                    elif row['phone_number'] == phone_number:
                        flash("Phone number is already registered.", "danger")
                conn.close()
                return render_template('register.html', datetime=datetime)
            
            # Retrieve all existing face encodings for face duplication check
            existing_encodings = conn.execute("SELECT face_encoding FROM users").fetchall()
            conn.close()

            # Process face
            rgb = process_image_from_filestorage(face_img)
            if rgb is None:
                flash("Invalid image.", "danger")
                return render_template('register.html', datetime=datetime)

            enc, count = single_face_encoding(rgb)
            if enc is None:
                flash("Exactly one clear face must be visible.", "danger")
                return render_template('register.html', datetime=datetime)

            # Check if face already exists
            if existing_encodings:
                known_encodings = [np.frombuffer(row['face_encoding'], dtype=np.float64) for row in existing_encodings]
                # Compare the current face with all known faces
                matches = face_recognition.compare_faces(known_encodings, enc, tolerance=0.45)
                if any(matches):
                    flash("This face is already registered to another user.", "danger")
                    return render_template('register.html', datetime=datetime)

            # Save face image permanently for now (can clean up later if OTP fails)
            filename = secure_filename(f"{uuid.uuid4().hex}.jpg")
            save_path = os.path.join(app.config['FACE_FOLDER'], filename)
            cv2.imwrite(save_path, cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))

            # Store in session for OTP verification
            otp = str(random.randint(1000, 9999)) # 4-digit OTP as requested
            
            # Send OTP via Email (Simulating SMS transmission)
            otp_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; background-color: #0b0b0b; color: #ffffff; padding: 20px;">
                <div style="max-width: 400px; margin: auto; background: #1a1a1a; padding: 30px; border-radius: 15px; border: 1px solid #ffc107; text-align: center;">
                    <h2 style="color: #ffc107;">Security Code</h2>
                    <p style="color: #ccc;">Use the code below to verify your phone number and complete your SecureVote registration.</p>
                    <div style="font-size: 3rem; font-weight: bold; color: #ffffff; margin: 20px 0; letter-spacing: 10px;">
                        {otp}
                    </div>
                    <p style="color: #666; font-size: 0.8em;">This code will expire shortly. Do not share this code with anyone.</p>
                </div>
            </body>
            </html>
            """
            # Send OTP based on user choice
            if otp_method == 'email':
                send_email(email, "SecureVote - Your Verification Code", otp_html)
                msg_target = email
            else:
                # Real SMS integration
                full_number = f"{country_code}{phone_number}"
                sms_sent = send_real_sms(full_number, otp)
                
                if not sms_sent:
                    flash("SMS API not configured! Could not send real SMS. Setup your .env file in the root directory.", "warning")
                    
                msg_target = full_number

            session['reg_data'] = {
                'first_name': first_name,
                'last_name': last_name,
                'password': generate_password_hash(password),
                'email': email,
                'uucms_number': uucms_number,
                'phone_number': phone_number,
                'country_code': country_code,
                'dob': dob_str,
                'face_image': filename,
                'face_encoding': enc.tobytes().hex() # Convert to hex for session storage
            }
            session['reg_otp'] = otp
            session.permanent = True # Ensure session is saved reliably
            
            # SIMULATION: Show OTP in flash for user
            flash(f"A 4-digit OTP has been sent to {msg_target}.", "info")
            # For local testing convenience:
            flash(f"DEBUG: Your OTP is {otp}", "warning") 

            return redirect(url_for('verify_otp'))

        except Exception as e:
            traceback.print_exc()
            flash("Registration error.", "danger")
    
    return render_template('register.html', datetime=datetime)

@app.route('/verify-otp', methods=['GET','POST'])
@app.route('/verify-registration', methods=['GET','POST'])
@app.route('/verify_otp', methods=['GET','POST'])
def verify_otp():
    if 'reg_data' not in session or 'reg_otp' not in session:
        return redirect(url_for('register'))
    
    if request.method == 'POST':
        user_otp = request.form.get('otp','').strip()
        if user_otp == session['reg_otp']:
            data = session['reg_data']
            try:
                conn = get_db()
                conn.execute("""
                    INSERT INTO users (first_name, last_name, password, email, uucms_number, phone_number, country_code, 
                                     dob, face_image, face_encoding)
                    VALUES (?,?,?,?,?,?,?,?,?,?)
                """, (data['first_name'], data['last_name'], data['password'], data['email'], 
                      data['uucms_number'], data['phone_number'], data['country_code'], data['dob'], 
                      data['face_image'], bytes.fromhex(data['face_encoding'])))
                conn.commit()
                conn.close()

                # Send Welcome Email
                welcome_html = f"""
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; border-top: 5px solid #ffc107;">
                        <h2 style="color: #333;">Welcome to SecureVote, {data['first_name']} {data['last_name']}!</h2>
                        <p style="color: #555; line-height: 1.6;">Congratulations! Your registration has been successfully processed.</p>
                        <p style="color: #555; line-height: 1.6;">You can now securely cast your vote in upcoming elections using our advanced biometric system.</p>
                        <div style="background: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <strong style="color: #333;">Registered Details:</strong><br>
                            <span style="color: #666;">UUCMS Number:</span> {data['uucms_number']}<br>
                            <span style="color: #666;">Email:</span> {data['email']}<br>
                            <span style="color: #666;">Phone:</span> {data['country_code']} {data['phone_number']}
                        </div>
                        <p style="color: #555; font-size: 0.9em;">If you have any problems or didn't recognize this activity, please contact support at support@securevote.com.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="#" style="background: #ffc107; color: black; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Voter Portal</a>
                        </div>
                    </div>
                    <p style="text-align: center; color: #888; font-size: 0.8em; margin-top: 20px;">© 2026 SecureVote - Making Voting Secure & Global</p>
                </body>
                </html>
                """
                send_email(data['email'], "Welcome to SecureVote - Registration Successful", welcome_html)

                session.pop('reg_data', None)
                session.pop('reg_otp', None)
                flash("Verification successful! You can now log in.", "success")
                return redirect(url_for('login'))
            except sqlite3.IntegrityError:
                flash("UUCMS Number or Email already exists.", "danger")
                return redirect(url_for('register'))
            except Exception as e:
                traceback.print_exc()
                flash("An enrollment error occurred.", "danger")
                return redirect(url_for('register'))
        else:
            flash("Invalid OTP. Please try again.", "danger")

    return render_template('verify_otp.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        uucms_number = request.form.get('uucms_number','').strip()
        password = request.form.get('password','')

        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE uucms_number = ?", (uucms_number,)).fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            session.clear()
            session['user_id'] = user['id']
            session['username'] = f"{user['first_name']} {user['last_name']}"
            session.permanent = True
            return redirect(url_for('face_verify'))
        flash("Invalid credentials.", "danger")
    return render_template('login.html')

@app.route('/logout')
def logout():
    # Record the type of user that's logging out
    is_admin = session.get('admin')
    is_user = session.get('user_id')
    
    # Clear the entire session first for security
    session.clear()
    
    # Show appropriate message
    if is_admin:
        flash("Admin logged out successfully.", "success")
    elif is_user:
        flash("Logged out successfully.", "success")
    else:
        flash("You have been logged out.", "info")
    
    return redirect(url_for('index'))

@app.route('/face-verify', methods=['GET','POST'])
def face_verify():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        files = request.files
        
        # Check if face image is present
        frame_base = files.get('frame_base')
        
        if not frame_base:
            flash("Please capture your face image.", "danger")
            return redirect(url_for('face_verify'))
            
        if not allowed_file(frame_base.filename):
            flash("Invalid file format. Please use only JPG/PNG images.", "danger")
            return redirect(url_for('face_verify'))
        
        try:
            # Process the frame
            face_img = process_image_from_filestorage(frame_base)
            
            if face_img is None:
                flash("Failed to process image. Please try again.", "danger")
                return redirect(url_for('face_verify'))
                
            # Ensure exactly one face is detected
            face_locations = face_recognition.face_locations(face_img)
            if len(face_locations) != 1:
                flash("Please ensure exactly one face is clearly visible.", "danger")
                return redirect(url_for('face_verify'))

            # Get face encoding
            face_encoding = face_recognition.face_encodings(face_img)[0]

            # Face match with stored encoding
            conn = get_db()
            row = conn.execute("SELECT face_encoding FROM users WHERE id = ?", (session['user_id'],)).fetchone()
            conn.close()
            if row is None:
                flash("User not found.", "danger")
                return redirect(url_for('login'))
            stored = np.frombuffer(row['face_encoding'], dtype=np.float64)

            # Compare with stored face
            match = face_recognition.compare_faces([stored], face_encoding, tolerance=0.45)[0]
            if not match:
                flash("Face does not match registration. Please try again.", "danger")
                return redirect(url_for('face_verify'))

            session['verified'] = True
            return redirect(url_for('vote'))
        except Exception as e:
            traceback.print_exc()
            flash("Verification error. Please try again.", "danger")
            return redirect(url_for('face_verify'))

    return render_template('face_verify.html')

@app.route('/vote', methods=['GET','POST'])
def vote():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    if not session.get('verified'):
        return redirect(url_for('face_verify'))

    uid = session['user_id']
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    if user['has_voted'] == 1:
        conn.close()
        return render_template('already_voted.html')

    if request.method == 'POST':
        cand = request.form.get('candidate')
        if cand is None:
            flash("Select a candidate.", "danger")
            conn.close()
            return redirect(url_for('vote'))
        try:
            conn.execute("INSERT INTO votes (user_id, candidate_id) VALUES (?,?)", (uid, cand))
            conn.execute("UPDATE users SET has_voted = 1, voted_at = datetime('now') WHERE id = ?", (uid,))
            conn.commit()
            flash("Your vote was recorded successfully.", "success")
            return redirect(url_for('result'))
        except sqlite3.IntegrityError:
            # UNIQUE(user_id) violation -> already voted
            conn.rollback()
            flash("You have already voted.", "info")
            return render_template('already_voted.html')
        finally:
            conn.close()

    candidates = conn.execute("SELECT * FROM candidates").fetchall()
    conn.close()
    return render_template('vote.html', candidates=candidates)

@app.route('/result')
def result():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    conn = get_db()
    results = conn.execute("""
        SELECT c.id, c.name, c.party, COALESCE(COUNT(v.id),0) AS vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        GROUP BY c.id
        ORDER BY vote_count DESC, name ASC
    """).fetchall()
    conn.close()
    return render_template('result.html', results=results)

# ----------------- Admin -----------------
@app.route('/admin', methods=['GET','POST'])
def admin_login():
    if request.method == 'POST':
        u = request.form.get('username','').strip()
        p = request.form.get('password','')
        conn = get_db()
        admin = conn.execute("SELECT * FROM admins WHERE username = ?", (u,)).fetchone()
        conn.close()
        if admin and check_password_hash(admin['password'], p):
            session['admin'] = True
            session['admin_id'] = admin['id']
            return redirect(url_for('admin_dashboard'))
        flash("Invalid admin credentials.", "danger")
    return render_template('admin_login.html')

@app.route('/admin/dashboard')
def admin_dashboard():
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    conn = get_db()
    cands = conn.execute("SELECT * FROM candidates").fetchall()
    stats = conn.execute("SELECT COUNT(*) AS total_votes FROM votes").fetchone()
    users_total = conn.execute("SELECT COUNT(*) AS total_users FROM users").fetchone()
    voted_users = conn.execute("SELECT COUNT(*) AS voted_users FROM users WHERE has_voted = 1").fetchone()
    
    # Get user details for the table
    users = conn.execute("""
        SELECT first_name, last_name, email, uucms_number, phone_number, country_code,
               has_voted, voted_at FROM users ORDER BY created_at DESC
    """).fetchall()
    
    conn.close()
    return render_template('admin_dashboard.html',
                         candidates=cands,
                         total_votes=stats['total_votes'],
                         total_users=users_total['total_users'],
                         voted_users=voted_users['voted_users'],
                         users=users)

@app.route('/admin/reset_votes', methods=['POST'])
def reset_votes():
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    
    conn = get_db()
    try:
        # Delete all votes
        conn.execute("DELETE FROM votes")
        # Reset user voting status
        conn.execute("UPDATE users SET has_voted = 0, voted_at = NULL")
        conn.commit()
        flash('All votes have been reset successfully', 'success')
    except Exception as e:
        conn.rollback()
        flash('Failed to reset votes: ' + str(e), 'error')
    finally:
        conn.close()
    
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/add_candidate', methods=['POST'])
def add_candidate():
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    name = request.form.get('name','').strip()
    party = request.form.get('party','').strip()
    logo = request.files.get('logo')
    logo_name = None
    if logo and allowed_file(logo.filename):
        logo_name = secure_filename(logo.filename)
        path = os.path.join(app.config['UPLOAD_FOLDER'], 'logos', logo_name)
        logo.save(path)
    conn = get_db()
    try:
        conn.execute("INSERT INTO candidates (name, party, logo) VALUES (?,?,?)", (name, party, logo_name))
        conn.commit()
        flash("Candidate added.", "success")
    except sqlite3.IntegrityError:
        conn.rollback()
        flash("Candidate already exists.", "danger")
    finally:
        conn.close()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/delete_candidate/<int:cid>')
def delete_candidate(cid):
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    conn = get_db()
    try:
        conn.execute("DELETE FROM candidates WHERE id = ?", (cid,))
        conn.commit()
        flash("Candidate deleted.", "success")
    except Exception:
        conn.rollback()
        flash("Error deleting candidate.", "danger")
    finally:
        conn.close()
    return redirect(url_for('admin_dashboard'))

# Logout route is defined at the top of the file

# Static helper (optional logos dir listing)
@app.route('/static/uploads/logos/<path:filename>')
def uploaded_logo(filename):
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'logos'), filename)

# About Pages
@app.route('/about-securevote')
def about_securevote():
    return render_template('about_securevote.html')

@app.route('/our-team')
def our_team():
    return render_template('our_team.html')

if __name__ == "__main__":
    import sys
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    print(f"Routes on port {port}:", app.url_map)
    app.run(debug=True, port=port)
