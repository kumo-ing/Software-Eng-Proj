from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
)
from database.db import get_db

friend_bp = Blueprint("friends", __name__)

@friend_bp.route("/", methods=["POST"])
@jwt_required()
def add_friend():
    """Add a friend."""
    data = request.get_json()
    friend_id = data.get("friend_id")
    user_id = get_jwt()["id"]

    if not friend_id:
        return jsonify({"error": "friend_id is required"}), 400

    try:
        friend_id = int(friend_id)
    except (ValueError, TypeError):
        return jsonify({"error": "friend_id must be an integer"}), 400

    if friend_id == user_id:
        return jsonify({"error": "You cannot add yourself as a friend"}), 400

    db = get_db()
    cursor = db.cursor()

    # Check if the friend exists
    cursor.execute("SELECT 1 FROM users WHERE id = ?", (friend_id,))
    if not cursor.fetchone():
        return jsonify({"error": "User does not exist"}), 404

    user1_id, user2_id = sorted((friend_id, user_id))

    # Check if already friends
    cursor.execute(
        "SELECT 1 FROM friends WHERE user1_id = ? AND user2_id = ?",
        (user1_id, user2_id)
    )
    if cursor.fetchone():
        return jsonify({"message": "Already friends"}), 409

    # Add to friends table
    cursor.execute(
        "INSERT INTO friends (user1_id, user2_id) VALUES (?, ?)",
        (user1_id, user2_id)
    )
    db.commit()

    return jsonify({"message": "Friend added successfully"}), 201


@friend_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_friends():
    """Get a list of all friends of the current user"""
    try:
        user_id = get_jwt()["id"]

        db = get_db()
        cursor = db.cursor()

        # Query: find all friends where current user is user1 or user2
        cursor.execute("""
            SELECT u.id, u.name, u.profile_pic
            FROM friends f
            JOIN users u
                ON (u.id = f.user1_id AND f.user2_id = ?)
                OR (u.id = f.user2_id AND f.user1_id = ?)
        """, (user_id, user_id))

        friends = [
            {
                "id": row["id"],
                "name": row["name"],
                "profile_pic": row["profile_pic"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({"friends": friends}), 200

    except Exception as e:
        print(f"\nError! Failed to fetch friends: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

