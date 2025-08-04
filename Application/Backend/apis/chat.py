from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from database.db import get_db

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/", methods=["POST"])
@jwt_required()
def send_message():
    """Send a chat message to a room"""
    try:
        data = request.get_json()
        user_id = get_jwt()["id"]
        room_id = data.get("room_id")
        message = data.get("message")

        if not room_id or not message:
            return jsonify({"error": "room_id and message are required"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You are not a member of this room"}), 403

        timestamp = datetime.utcnow().isoformat()

        cursor.execute("""
            INSERT INTO chat (room_id, user_id, datetime, message)
            VALUES (?, ?, ?, ?)
        """, (room_id, user_id, timestamp, message))
        db.commit()

        return jsonify({"message": "Message sent successfully!"}), 201

    except Exception as e:
        print(f"\nError! Failed to send message: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@chat_bp.route("/<int:room_id>/", methods=["GET"])
@jwt_required()
def get_messages(room_id):
    """Get all messages in a room (only if user is a member), including system messages."""
    try:
        user_id = get_jwt()["id"]

        db = get_db()
        cursor = db.cursor()

        # Ensure requesting user is a member
        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You are not a member of this room"}), 403

        # Fetch all messages, including system messages (e.g., user_id=99999)
        cursor.execute("""
            SELECT 
                c.message,
                c.datetime,
                u.id AS user_id,
                COALESCE(rm.nickname, u.name) AS nickname,  -- use nickname if exists, else fallback to username
                u.profile_pic
            FROM chat c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN room_members rm ON rm.user_id = u.id AND rm.room_id = c.room_id
            WHERE c.room_id = ?
            ORDER BY c.datetime ASC
        """, (room_id,))

        messages = [
            {
                "user_id": str(row["user_id"]),
                "username": row["nickname"],  # nickname or fallback to user name
                "profile_pic": row["profile_pic"],
                "message": row["message"],
                "datetime": row["datetime"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({"messages": messages}), 200

    except Exception as e:
        print(f"\nError! Failed to fetch messages: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# @chat_bp.route("/<int:room_id>/", methods=["GET"])
# @jwt_required()
# def get_messages(room_id):
#     """Get all messages in a room (only if user is a member)"""
#     try:
#         user_id = get_jwt()["id"]

#         db = get_db()
#         cursor = db.cursor()

#         cursor.execute(
#             "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
#             (user_id, room_id)
#         )
#         if not cursor.fetchone():
#             return jsonify({"error": "You are not a member of this room"}), 403

#         cursor.execute("""
#             SELECT c.message, c.datetime, u.id AS user_id, u.name AS username, u.profile_pic
#             FROM chat c
#             JOIN users u ON c.user_id = u.id
#             WHERE c.room_id = ?
#             ORDER BY c.datetime ASC
#         """, (room_id,))

#         messages = [
#             {
#                 "user_id": row["user_id"],
#                 "username": row["username"],
#                 "profile_pic": row["profile_pic"],
#                 "message": row["message"],
#                 "datetime": row["datetime"]
#             }
#             for row in cursor.fetchall()
#         ]

#         return jsonify({"messages": messages}), 200

#     except Exception as e:
#         print(f"\nError! Failed to fetch messages: {e}")
#         return jsonify({"error": "Internal Server Error"}), 500


def add_system_message(grp_id, message):
    """Insert a system-generated message into a chat group using SYSTEM user (id = 0)."""
    try:
        db = get_db()
        cursor = db.cursor()

        timestamp = datetime.utcnow().isoformat()

        cursor.execute("""
            INSERT INTO chat (room_id, user_id, datetime, message)
            VALUES (?, ?, ?, ?)
        """, (grp_id, 99999, timestamp, message))

        db.commit()
        return True

    except Exception as e:
        print(f"Error adding system message: {e}")
        return False
