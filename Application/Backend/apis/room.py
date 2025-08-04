from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
)
from database.db import get_db
import random
import string


room_bp = Blueprint("rooms", __name__)

def generate_room_code(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


@room_bp.route("/", methods=["POST"])
@jwt_required()
def create_room():
    """Create a new room and initialize room preferences"""
    try:
        current_user = get_jwt()
        data = request.get_json(silent=True) or request.form

        if not data:
            print(f"\nError! Invalid JSON format")
            return jsonify({"error": "Invalid JSON format"}), 400

        roomname = data.get("roomname")
        nickname = data.get("nickname")
        user_id = current_user["id"]
        room_code = generate_room_code()

        if not all([roomname, nickname]):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "INSERT INTO rooms (name, room_code) VALUES (?, ?)",
            (roomname, room_code)
        )
        db.commit()

        room_id = cursor.lastrowid

        cursor.execute(
            "INSERT INTO room_members (user_id, room_id, nickname) VALUES (?, ?, ?)",
            (user_id, room_id, nickname)
        )

        print("error here?")
        cursor.execute(
            "INSERT INTO room_preference (room_id) VALUES (?)",
            (room_id,)
        )

        db.commit()

        return jsonify({"message": "Room created successfully!"}), 201

    except Exception as e:
        print(f"\nError! Failed to create room: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_bp.route("/", methods=["PUT"])
@jwt_required()
def join_room():
    """Join an existing room via room_code"""
    try:
        current_user = get_jwt()
        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        room_code = data.get("room_code")
        nickname = data.get("nickname")
        user_id = current_user["id"]

        if not all([room_code, nickname, user_id]):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute("SELECT id FROM rooms WHERE room_code = ?", (room_code,))
        row = dict(result) if (result := cursor.fetchone()) else None
        
        if not row:
            return jsonify({"error": "Room not found"}), 404

        room_id = row["id"]

        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if cursor.fetchone():
            return jsonify({"error": "User is already a member of this room"}), 409

        cursor.execute(
            "INSERT INTO room_members (user_id, room_id, nickname) VALUES (?, ?, ?)",
            (user_id, room_id, nickname)
        )
        db.commit()

        return jsonify({"message": "Room joined successfully!"}), 201

    except Exception as e:
        print(f"\nError! Failed to join room: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_bp.route("/", methods=["GET"])
@jwt_required()
def get_rooms():
    """Get all active rooms that the current user is in"""
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            SELECT
                r.id,
                r.name,
                r.room_code,
                r.date,
                r.meal,
                r.location,
                rm.nickname,
                (
                    SELECT COUNT(*)
                    FROM room_members rm2
                    WHERE rm2.room_id = r.id
                ) AS member_count
            FROM room_members rm
            JOIN rooms r ON rm.room_id = r.id
            WHERE rm.user_id = ? AND r.status = 'active'
        """, (user_id,))

        rows = cursor.fetchall()

        rooms = [
            {
                "id": row["id"],
                "name": row["name"],
                "room_code": row["room_code"],
                "date": row["date"],
                "meal": row["meal"],
                "location": row["location"],
                "nickname": row["nickname"],
                "member_count": row["member_count"]
            }
            for row in rows
        ]

        return jsonify({"rooms": rooms}), 200

    except Exception as e:
        print(f"\nError! Failed to fetch rooms: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_bp.route("/", methods=["DELETE"])
@jwt_required()
def exit_room():
    """Remove the current user from a room"""
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        data = request.get_json(silent=True) or request.form
        room_id = data.get("room_id")

        if not room_id:
            return jsonify({"error": "room_id is required"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "User is not in the specified room"}), 404

        cursor.execute(
            "DELETE FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        db.commit()

        return jsonify({"message": "You have left the room successfully."}), 200

    except Exception as e:
        print(f"\nError! Failed to leave room: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@room_bp.route("/close/", methods=["DELETE"])
@jwt_required()
def close_room():
    """Soft-delete a room by updating its status to 'deleted'"""
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        data = request.get_json(silent=True) or request.form
        room_id = data.get("room_id")

        if not room_id:
            return jsonify({"error": "room_id is required"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You are not a member of this room"}), 403

        cursor.execute(
            "UPDATE rooms SET status = ? WHERE id = ?",
            ("deleted", room_id)
        )
        db.commit()

        return jsonify({"message": "Room closed successfully."}), 200

    except Exception as e:
        print(f"\nError! Failed to close room: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_bp.route("/members/", methods=["GET"])
@jwt_required()
def get_all_members():
    """Get all members of a room, only if user is part of it"""
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        room_id = request.args.get("room_id")

        if not room_id:
            return jsonify({"error": "room_id is required"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You are not a member of this room"}), 403

        cursor.execute("""
            SELECT u.id, u.name, u.profile_pic, rm.nickname
            FROM room_members rm
            JOIN users u ON rm.user_id = u.id
            WHERE rm.room_id = ?
        """, (room_id,))

        members = [
            {
                "id": row["id"],
                "name": row["name"],
                "profile_pic": row["profile_pic"],
                "nickname": row["nickname"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({"members": members}), 200

    except Exception as e:
        print(f"\nError! Failed to fetch members: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_bp.route("/past/", methods=["GET"])
@jwt_required()
def view_past_rooms():
    """Get all past rooms (non-active) that the current user was part of"""
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        db = get_db()
        cursor = db.cursor()

        cursor.execute("""
            SELECT
                r.id,
                r.name,
                r.room_code,
                r.date,
                r.meal,
                r.location,
                r.status,
                rm.nickname,
                (
                    SELECT COUNT(*)
                    FROM room_members rm2
                    WHERE rm2.room_id = r.id
                ) AS member_count
            FROM room_members rm
            JOIN rooms r ON rm.room_id = r.id
            WHERE rm.user_id = ? AND r.status != 'active'
        """, (user_id,))

        rows = cursor.fetchall()

        rooms = [
            {
                "id": row["id"],
                "name": row["name"],
                "room_code": row["room_code"],
                "date": row["date"],
                "meal": row["meal"],
                "location": row["location"],
                "status": row["status"],
                "nickname": row["nickname"],
                "member_count": row["member_count"]
            }
            for row in rows
        ]

        return jsonify({"past_rooms": rooms}), 200

    except Exception as e:
        print(f"\nError! Failed to fetch past rooms: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@room_bp.route("/info/<int:room_id>/", methods=["GET"])
@jwt_required()
def get_room_info(room_id):
    """Get room information and preferences"""
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You are not a member of this room"}), 403

        cursor.execute("""
            SELECT *
            FROM rooms r
            JOIN room_preference rp ON r.id = rp.room_id
            WHERE r.id = ?
        """, (room_id,))

        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Room not found"}), 404

        room_info = {
            "name": row["name"],
            "date": row["date"],
            "meal": row["meal"], 
            "location": row["location"],
            "cuisine":row["cuisine"],
            "restaurant": row["restaurant"],
            "room_code": row["room_code"],
            "status": row["status"],
            "time_preferences": row["time_preferences_list"],
            "cuisine_list": row["cuisine_list"],
            "location_list": row["location_list"],
            "generated_food_list": row["generated_food_list"]
        }

        return jsonify({"room_info": room_info}), 200

    except Exception as e:
        print(f"\nError! Failed to fetch room info: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_bp.route("/add_friend", methods=["POST"])
@jwt_required()
def add_friend_to_room():
    """Add a friend to a room by room_id and friend_id."""
    try:
        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        room_id = data.get("room_id")
        friend_id = data.get("friend_id")
        nickname = data.get("nickname")

        if not all([room_id, friend_id, nickname]):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room not found"}), 404

        # Check if the friend is already in the room
        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (friend_id, room_id)
        )
        if cursor.fetchone():
            return jsonify({"error": "Friend is already a member of this room"}), 409

        # Add friend to the room
        cursor.execute(
            "INSERT INTO room_members (user_id, room_id, nickname) VALUES (?, ?, ?)",
            (friend_id, room_id, nickname)
        )
        db.commit()

        return jsonify({"message": "Friend added to room successfully!"}), 201

    except Exception as e:
        print(f"\nError! Failed to add friend to room: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

