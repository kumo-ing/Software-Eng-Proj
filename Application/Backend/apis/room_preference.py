from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
)
from database.db import get_db
import random
import json
from collections import Counter
from .chat import add_system_message
from datetime import datetime, timezone, timedelta
import random


room_preference_bp = Blueprint("room_preference", __name__)

@room_preference_bp.route("/time/", methods=["POST"])
@jwt_required()
def add_or_update_time_preference():
    try:
        current_user = get_jwt()
        user_id = current_user["id"]
        
        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400
        
        availability = data.get("availibility")  # should be a dict like {"date": ..., "meals": [...]}
        room_id = data.get("room_id")

        if not availability or not room_id:
            return jsonify({"error": "Missing required parameters"}), 400

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get current preferences
        cursor.execute("SELECT time_preferences_list FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Preferences not initialized for this room"}), 404

        current_prefs = json.loads(row["time_preferences_list"])

        # Check if the user already has an entry
        updated = False
        for entry in current_prefs:
            if entry["user_id"] == user_id:
                entry["availability"] = availability
                updated = True
                break

        if not updated:
            # If not found, append new
            current_prefs.append({
                "user_id": user_id,
                "availability": availability
            })

        # Update the DB
        cursor.execute("""
            UPDATE room_preference
            SET time_preferences_list = ?
            WHERE room_id = ?
        """, (json.dumps(current_prefs), room_id))

        db.commit()

        return jsonify({"message": "Availability updated successfully!" if updated else "Availability added successfully!"}), 200

    except Exception as e:
        print(f"\nError! Failed to update/add time preference: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_preference_bp.route("/time/<int:room_id>/", methods=["GET"])
@jwt_required()
def get_time_preference(room_id):
    try:
        current_user = get_jwt()
        user_id = current_user["id"]

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get time preferences from DB
        cursor.execute("SELECT time_preferences_list FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()

        if not row or not row["time_preferences_list"]:
            return jsonify({
                "room_id": room_id,
                "user_id": user_id,
                "availability": []
            }), 200

        current_prefs = json.loads(row["time_preferences_list"])

        for entry in current_prefs:
            if entry["user_id"] == user_id:
                return jsonify({
                    "room_id": room_id,
                    "user_id": user_id,
                    "availability": entry["availability"]
                }), 200

        # User not found in list
        return jsonify({
            "room_id": room_id,
            "user_id": user_id,
            "availability": []
        }), 200

    except Exception as e:
        print(f"\nError! Failed to retrieve time preference: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_preference_bp.route("/cuisine/", methods=["POST"])
@jwt_required()
def add_or_update_cuisine_preference():
    try:
        current_user = get_jwt()
        user_id = str(current_user["id"])  # use string for JSON keys

        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        cuisines = data.get("cuisines")  # should be a list like ["chinese", "western"]
        room_id = data.get("room_id")

        if not cuisines or not room_id:
            return jsonify({"error": "Missing required parameters"}), 400

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get existing cuisine list (if any)
        cursor.execute("SELECT cuisine_list FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Preferences not initialized for this room"}), 404

        # Safely load JSON as dict
        cuisine_data = {}
        raw_data = row["cuisine_list"]

        if raw_data:
            try:
                parsed = json.loads(raw_data)
                if isinstance(parsed, dict):
                    cuisine_data = parsed
                else:
                    print("Warning: cuisine_list was not a dict. Resetting.")
            except json.JSONDecodeError:
                print("Warning: Invalid JSON in cuisine_list. Resetting.")

        # Update or add the user’s cuisine preference
        cuisine_data[user_id] = cuisines

        # Save back to DB
        cursor.execute("""
            UPDATE room_preference
            SET cuisine_list = ?
            WHERE room_id = ?
        """, (json.dumps(cuisine_data), room_id))

        db.commit()

        return jsonify({"message": "Cuisine preferences updated successfully!"}), 200

    except Exception as e:
        print(f"\nError! Failed to update/add cuisine preference: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_preference_bp.route("/cuisine/<int:room_id>", methods=["GET"])
@jwt_required()
def get_cuisine_preference(room_id):
    try:
        current_user = get_jwt()
        user_id = str(current_user["id"])  # Use string because JSON keys are strings

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get cuisine_list JSON from DB
        cursor.execute("SELECT cuisine_list FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()

        if not row or not row["cuisine_list"]:
            return jsonify({
                "room_id": room_id,
                "user_id": user_id,
                "cuisines": []
            }), 200

        cuisine_data = json.loads(row["cuisine_list"])

        return jsonify({
            "room_id": room_id,
            "user_id": user_id,
            "cuisines": cuisine_data.get(user_id, [])
        }), 200

    except Exception as e:
        print(f"\nError! Failed to retrieve cuisine preference: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
    
@room_preference_bp.route("/location/", methods=["POST"])
@jwt_required()
def add_or_update_location_preference():
    try:
        current_user = get_jwt()
        user_id = str(current_user["id"])

        data = request.get_json(silent=True) or request.form

        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        locations = data.get("locations")  # Expected: ["Jurong East", "Bugis"]
        room_id = data.get("room_id")

        if not locations or not room_id:
            return jsonify({"error": "Missing required parameters"}), 400

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get existing location list (if any)
        cursor.execute("SELECT location_list FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Preferences not initialized for this room"}), 404

        location_data = {}
        raw_data = row["location_list"]

        if raw_data:
            try:
                parsed = json.loads(raw_data)
                if isinstance(parsed, dict):
                    location_data = parsed
                else:
                    print("Warning: location_list was not a dict. Resetting.")
            except json.JSONDecodeError:
                print("Warning: Invalid JSON in location_list. Resetting.")

        # Update or add the user’s location preference
        location_data[user_id] = locations

        # Save back to DB
        cursor.execute("""
            UPDATE room_preference
            SET location_list = ?
            WHERE room_id = ?
        """, (json.dumps(location_data), room_id))

        db.commit()

        return jsonify({"message": "Location preferences updated successfully!"}), 200

    except Exception as e:
        print(f"\nError! Failed to update/add location preference: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@room_preference_bp.route("/location/<int:room_id>", methods=["GET"])
@jwt_required()
def get_location_preference(room_id):
    try:
        current_user = get_jwt()
        user_id = str(current_user["id"])

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get location_list JSON from DB
        cursor.execute("SELECT location_list FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()

        if not row or not row["location_list"]:
            return jsonify({
                "room_id": room_id,
                "user_id": user_id,
                "locations": []
            }), 200

        location_data = json.loads(row["location_list"])

        return jsonify({
            "room_id": room_id,
            "user_id": user_id,
            "locations": location_data.get(user_id, [])
        }), 200

    except Exception as e:
        print(f"\nError! Failed to retrieve location preference: {e}")
        return jsonify({"error": "Internal Server Error"}), 500



@room_preference_bp.route("/finalize/<int:room_id>", methods=["POST"])
@jwt_required()
def finalize_room_preferences(room_id):
    try:
        db = get_db()
        cursor = db.cursor()

        # --- Check if room exists ---
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # --- Fetch preferences ---
        cursor.execute("""
            SELECT time_preferences_list, location_list, cuisine_list
            FROM room_preference
            WHERE room_id = ?
        """, (room_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Preferences not initialized for this room"}), 404

        # --- Parse preferences safely ---
        try:
            time_list = json.loads(row["time_preferences_list"])
            location_dict = json.loads(row["location_list"])
            cuisine_dict = json.loads(row["cuisine_list"])
        except Exception as e:
            print("Error parsing JSON:", e)
            return jsonify({"error": "Corrupted preference data"}), 500

        # --- Count votes ---
        date_counter = Counter()
        meal_counter = Counter()
        location_counter = Counter()

        # Count dates and meals
        for entry in time_list:
            availability = entry.get("availability", [])
            for slot in availability:
                date = slot.get("date")
                meals = slot.get("meals", [])
                if date:
                    date_counter[date] += 1
                    for meal in meals:
                        meal_counter[meal] += 1

        # Count locations
        for user_id, locs in location_dict.items():
            for loc in locs:
                location_counter[loc] += 1

        # Count cuisines
        all_cuisines = []
        for cuisines in cuisine_dict.values():
            all_cuisines.extend(cuisines)
        cuisine_counter = Counter(all_cuisines)

        if not date_counter or not meal_counter or not location_counter or not cuisine_counter:
            return jsonify({"error": "Insufficient data to finalize room"}), 400

        # --- Pick most common values ---
        most_common_date = date_counter.most_common(1)[0][0]
        most_common_meal = meal_counter.most_common(1)[0][0]
        most_common_location = location_counter.most_common(1)[0][0]

        # Pick 1 final cuisine (random if tie)
        max_cuisine_votes = cuisine_counter.most_common(1)[0][1]
        tied_top_cuisines = [c for c, count in cuisine_counter.items() if count == max_cuisine_votes]
        final_cuisine = random.choice(tied_top_cuisines)

        # --- Update the room ---
        cursor.execute("""
            UPDATE rooms
            SET date = ?, meal = ?, location = ?, cuisine = ?
            WHERE id = ?
        """, (most_common_date, most_common_meal, most_common_location, final_cuisine, room_id))

        db.commit()

        # Convert ISO string to datetime in UTC
        utc_dt = datetime.fromisoformat(most_common_date.replace("Z", "+00:00"))

        # Convert to Singapore time (UTC+8)
        sg_dt = utc_dt.astimezone(timezone(timedelta(hours=8)))

        # Format only date (no time)
        formatted_date = sg_dt.strftime("%Y-%m-%d")

        # Use formatted date in system message
        add_system_message(
            room_id,
            f"SYSTEM GENERATED MESSAGE:\nDate: {formatted_date}\nArea: {most_common_location}\nMeal: {most_common_meal}\nCuisine: {final_cuisine}"
        )

        return jsonify({
            "message": "Room finalized successfully.",
            "date": formatted_date,
            "meal": most_common_meal,
            "location": most_common_location,
            "cuisine": final_cuisine
        }), 200

    except Exception as e:
        print(f"\nError finalizing room preferences: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_preference_bp.route("/confirm/<int:room_id>", methods=["POST"])
@jwt_required()
def confirm_room_preference(room_id):
    try:
        current_user = get_jwt()
        user_id = str(current_user["id"])  # Store as string for consistency

        db = get_db()
        cursor = db.cursor()

        # Ensure room preference entry exists
        cursor.execute("SELECT confirmed_user FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Room preference not found"}), 404

        # Load existing confirmed users
        try:
            confirmed_users = json.loads(row["confirmed_user"])
            if not isinstance(confirmed_users, list):
                confirmed_users = []
        except json.JSONDecodeError:
            confirmed_users = []

        # Add user if not already present
        if user_id not in confirmed_users:
            confirmed_users.append(user_id)

            cursor.execute("""
                UPDATE room_preference
                SET confirmed_user = ?
                WHERE room_id = ?
            """, (json.dumps(confirmed_users), room_id))
            db.commit()

        return jsonify({
            "message": "User confirmed successfully.",
            "confirmed_user": confirmed_users
        }), 200

    except Exception as e:
        print(f"\nError confirming user: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@room_preference_bp.route("/summary/<int:room_id>", methods=["GET"])
@jwt_required()
def get_submission_summary(room_id):
    try:
        current_user = get_jwt()
        user_id = str(current_user["id"])

        db = get_db()
        cursor = db.cursor()

        # Check if room exists
        cursor.execute("SELECT 1 FROM rooms WHERE id = ?", (room_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Room does not exist"}), 404

        # Get confirmed users
        cursor.execute("SELECT confirmed_user FROM room_preference WHERE room_id = ?", (room_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Room preference not found"}), 404

        try:
            confirmed_users = json.loads(row["confirmed_user"])
            if not isinstance(confirmed_users, list):
                confirmed_users = []
        except json.JSONDecodeError:
            confirmed_users = []

        # Get total users in room from room_members table
        cursor.execute("SELECT COUNT(*) AS total FROM room_members WHERE room_id = ?", (room_id,))
        total_users = cursor.fetchone()["total"]

        return jsonify({
            "room_id": room_id,
            "user_id": user_id,
            "has_submitted": user_id in confirmed_users,
            "confirmed_count": len(confirmed_users),
            "total_users": total_users
        }), 200

    except Exception as e:
        print(f"\nError retrieving submission summary: {e}")
        return jsonify({"error": "Internal Server Error"}), 500



"""
Generated Food list based on location
Upvote
Downvote
Calculate preferred food
"""
