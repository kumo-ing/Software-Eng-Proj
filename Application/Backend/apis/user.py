import os
from flask import Blueprint, request, jsonify, send_from_directory, make_response
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt,
    get_jti,
)
from database.db import get_db
from werkzeug.utils import secure_filename
import uuid
from datetime import timedelta
import time

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from email_sender import send_email, generate_otp

users_bp = Blueprint("user", __name__)

IMAGE_URL_Path = "http://localhost:5000/api/users/profilepic?filename="
UPLOAD_FOLDER = "./assets/profilepic"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
GOOGLE_CLIENT_ID = "614838875620-53vlupjbc5pahigc7i4bd99kqaq32a8p.apps.googleusercontent.com"

pending_signups = {}

def clean_expired_signups():
    """Remove pending signups older than 5 minutes (300 seconds)."""
    current_time = time.time()
    expired_emails = [
        email for email, data in pending_signups.items()
        if current_time - data["timestamp"] > 300
    ]
    for email in expired_emails:
        del pending_signups[email]
        print(f"Cleaned expired signup for {email}")

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename):
    """Check if the file has a valid extension."""
    split_name = filename.rsplit(".", 1)

    if not len(split_name) == 2:
        return False
    return split_name[1].lower() in ALLOWED_EXTENSIONS


def create_jwt_token(user_dict):
    """Create a JWT token with user data."""
    expires_delta = timedelta(days=1)

    access_token = create_access_token(
        identity=user_dict["name"],
        additional_claims={
            "id": user_dict["id"],
            "profile_pic": user_dict.get("profile_pic", ""),
        },
        expires_delta=expires_delta,
    )
    jti = get_jti(access_token)

    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE users SET jti = ? WHERE id = ?",
        (jti, user_dict["id"]),
    )

    db.commit()

    return access_token


@users_bp.route("/signup/", methods=["POST"])
def signup():
    """Initiate signup by sending OTP to user's email."""
    try:
        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        username = data.get("username")
        email = data.get("email")
        number = data.get("number")
        password = data.get("password")

        if not all([username, email, number, password]):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already in use"}), 409

        # Generate OTP and store signup info temporarily
        otp = generate_otp()
        pending_signups[email] = {
            "username": username,
            "number": number,
            "password": password,
            "otp": otp,
            "timestamp": time.time(),
            "profile_pic": IMAGE_URL_Path + "default.png"
        }

        send_email(
            receiver_email=email,
            subject="Your Signup OTP",
            body=f"Your OTP for signup is: {otp}"
        )

        return jsonify({"message": "OTP sent to your email"}), 200

    except Exception as e:
        print(f"\nError! Failed to initiate signup: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/verify_otp/", methods=["POST"])
def verify_otp():
    """Verify OTP and complete user registration."""
    try:
        clean_expired_signups()
        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        email = data.get("email")
        otp_input = data.get("otp")

        if not all([email, otp_input]):
            return jsonify({"error": "Missing email or OTP"}), 400

        user_data = pending_signups.get(email)

        if not user_data:
            return jsonify({"error": "No pending signup found for this email"}), 404

        if user_data["otp"] != otp_input:
            return jsonify({"error": "Invalid OTP"}), 401

        # OTP matched — insert into DB
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, number, password, profile_pic) VALUES (?, ?, ?, ?, ?)",
            (user_data["username"], email, user_data["number"], user_data["password"], user_data["profile_pic"]),
        )
        db.commit()

        # Remove from pending
        del pending_signups[email]

        return jsonify({"message": "User registered successfully!"}), 201

    except Exception as e:
        print(f"\nError! OTP verification failed: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/", methods=["POST"])
def user_login():
    try:
        data = request.get_json(silent=True) or request.form

        if not data:
            print(f"\nError! Invalid JSON format")
            return jsonify({"error": "Invalid JSON format"}), 400

        email = data.get("email")
        password = data.get("password")

        if not all([email, password]):
            return jsonify({"error": "Missing email or password"}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,),
        )

        row = dict(result) if (result := cursor.fetchone()) else None

        if row and row["password"] == password:
            access_token = create_jwt_token(row)
            return jsonify(access_token=access_token, message="Login successful!"), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        print(f"\nError! Error during login: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/oauth/google/", methods=["POST"])
def login_with_google():
    """
    Login or register a user using Google OAuth
    Expects: { "credential": "<google_id_token>" }
    """
    try:
        data = request.get_json(silent=True)
        if not data or "credential" not in data:
            return jsonify({"error": "Missing Google credential"}), 400

        token = data["credential"]

        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            audience=GOOGLE_CLIENT_ID
        )

        if not idinfo.get("email_verified"):
            return jsonify({"error": "Email not verified"}), 401

        email = idinfo["email"]
        name = idinfo["name"]
        picture = idinfo.get("picture", IMAGE_URL_Path + "default.png")

        db = get_db()
        cursor = db.cursor()

        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = dict(result) if (result := cursor.fetchone()) else None

        if user:
            access_token = create_jwt_token(user)

            return jsonify({
                "access_token": access_token,
                "message": "Google OAuth login successful"
            }), 200

        if not user:
            cursor.execute("""
                INSERT INTO users (name, email, number, password, profile_pic, login_type)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                name,
                email,
                "00000000",
                "google-oauth",
                picture,
                "google"
            ))
            db.commit()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = dict(cursor.fetchone())

        access_token = create_jwt_token(user)

        return jsonify({
            "access_token": access_token,
            "message": "Google OAuth login successful"
        }), 200

    except ValueError:
        return jsonify({"error": "Invalid Google credential"}), 401
    except Exception as e:
        print(f"\nError! Google login failed: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/", methods=["PUT"])
@jwt_required()
def edit_name():
    """Edit name of user"""
    try:
        current_user = get_jwt()
        data = request.get_json(silent=True) or request.form

        if not data:
            print(f"\nError! Invalid JSON format")
            return jsonify({"error": "Invalid JSON format"}), 400

        username = data.get("username")
        user_id = current_user["id"]

        if not all([username]):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute("UPDATE users SET name = ? WHERE id = ?", (username, user_id))
        db.commit()

        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        updated_user = dict(cursor.fetchone())

        # Generate a new token with updated name
        access_token = create_jwt_token(updated_user)

        return (
            jsonify(
                {
                    "message": "Username updated successfully!",
                    "access_token": access_token,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"\nError! Failed to update username: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/profile_pic/", methods=["POST"])
@jwt_required()
def upload_profilepic():
    """Upload profile pic to server"""
    try:
        # save the file to the server
        if "file" not in request.files:
            print(f"\nError! Failed to send profile_pic. No file part")
            return jsonify({"error": "No file part"}), 400

        file = request.files["file"]

        if file.filename == "":
            print(f"\nError! Failed to send profile_pic. No selected file")
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(file.filename):
            print(f"\nError! Failed to send profile_pic. Invalid file type")
            return (
                jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg"}),
                400,
            )

        generated_uuid = uuid.uuid4().hex
        extension_type = file.filename.rsplit(".", 1)[1]
        saved_filename = f"{generated_uuid}.{extension_type}"

        filepath = os.path.join(UPLOAD_FOLDER, saved_filename)
        file.save(filepath)

        # Update the profile_pic field in the users database
        current_user = get_jwt()

        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "UPDATE users SET profile_pic = ? WHERE id = ?",
            (IMAGE_URL_Path + saved_filename, current_user["id"]),
        )
        db.commit()

        return (
            jsonify({
                "success": "File uploaded successfully",
                "profile_pic": IMAGE_URL_Path + saved_filename
            }),
            200,
        )

    except Exception as e:
        print(f"\nError! Failed to add photo: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/profilepic/", methods=["GET"])
# @jwt_required()
def get_profile_pic():
    """Retrieve a profile picture by filename."""
    filename = request.args.get("filename")

    if not filename:
        return jsonify({"error": "Filename parameter is required"}), 400

    filename = secure_filename(filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    return send_from_directory(UPLOAD_FOLDER, filename)


@users_bp.route("/info/", methods=["GET"])
@jwt_required()
def get_basic_info():
    """Get basic info of users. Return name, profile_pic for multiple user IDs."""
    try:
        user_ids = request.args.get("user_id")

        if not user_ids:
            return jsonify({"error": "user_id is required"}), 400

        try:
            user_ids = [int(uid.strip()) for uid in user_ids.split(",")]
        except ValueError:
            return jsonify({"error": "Invalid user_id format"}), 400

        db = get_db()
        cursor = db.cursor()
        placeholders = ",".join("?" for _ in user_ids)
        query = f"SELECT id, name, profile_pic FROM users WHERE id IN ({placeholders})"

        cursor.execute(query, user_ids)
        results = cursor.fetchall()

        if not results:
            return jsonify({"error": "No users found"}), 404

        return (
            jsonify(
                [
                    {
                        "id": row["id"],
                        "name": row["name"],
                        "profile_pic": row["profile_pic"],
                    }
                    for row in results
                ]
            ),
            200,
        )

    except Exception as e:
        print(f"\nError! Failed to fetch user info: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@users_bp.route("/logout/", methods=["POST"])
@jwt_required()
def logout():
    """Logout the user by revoking the token."""
    try:
        jti = get_jwt()["jti"]
        db = get_db()
        cursor = db.cursor()
        cursor.execute("UPDATE users SET jti = NULL WHERE jti = ?", (jti,))
        db.commit()

        return jsonify({"message": "Logout successful"}), 200

    except Exception as e:
        print(f"\nError! Failed to logout: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
    

@users_bp.route("/refresh/", methods=["POST"])
@jwt_required()
def refresh_token():
    """Generate a fresh JWT using the existing one"""
    try:
        current_user = get_jwt()

        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (current_user["id"],))
        user_row = dict(result) if (result := cursor.fetchone()) else None

        if not user_row:
            return jsonify({"error": "User not found"}), 404

        new_token = create_jwt_token(user_row)
        return jsonify(access_token=new_token, message="Token refreshed"), 200

    except Exception as e:
        print(f"\nError refreshing token: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
    
    