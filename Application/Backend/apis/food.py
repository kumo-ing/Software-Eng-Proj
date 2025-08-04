from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
)
from database.db import get_db
import requests
import os
from dotenv import load_dotenv
import json

food_bp = Blueprint("food", __name__)
load_dotenv()

def search_restaurants_by_location_and_cuisine(location, cuisine):
    """Search for restaurants by cuisine and location using Google Maps Places API.
    Returns a list of restaurant dictionaries. If error occurs, returns an empty list.
    """
    try:
        query = f"{cuisine} restaurants in {location}"
        GOOGLE_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")

        if not GOOGLE_API_KEY:
            print("Google Maps API key not configured.")
            return []

        api_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": query,
            "key": GOOGLE_API_KEY
        }

        response = requests.get(api_url, params=params)
        if response.status_code != 200:
            print("Failed to contact Google Maps API")
            return []

        data = response.json()

        restaurant_list = [
            {
                "name": r.get("name"),
                "address": r.get("formatted_address"),
                "rating": r.get("rating"),
                "place_id": r.get("place_id")
            }
            for r in data.get("results", [])
        ]

        return restaurant_list

    except Exception as e:
        print(f"Error searching restaurants: {e}")
        return []

@food_bp.route("/", methods=["GET"])
@jwt_required()
def get_food_list():
    """Get a list of all food items"""
    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM food")
    food_list = cursor.fetchall()

    return jsonify(food_list), 200


@food_bp.route("/review/", methods=["POST"])
@jwt_required()
def add_review():
    """Add a review for a restaurant. Creates restaurant if not found."""
    try:
        data = request.get_json()
        name = data.get("name")
        location = data.get("location")
        operating_hours = data.get("operating_hours", "Not Provided")
        comment = data.get("comment")
        rating = data.get("rating")
        user_id = get_jwt()["id"]

        if not all([name, location, comment, rating]):
            return jsonify({"error": "name, location, comment, and rating are required"}), 400

        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT id FROM restaurant WHERE name = ? AND location = ?",
            (name, location)
        )
        result = cursor.fetchone()

        if result:
            restaurant_id = result["id"]
        else:
            cursor.execute(
                "INSERT INTO restaurant (name, location, operating_hours) VALUES (?, ?, ?)",
                (name, location, operating_hours)
            )
            restaurant_id = cursor.lastrowid

        cursor.execute(
            "INSERT INTO review (user_id, restaurant_id, comment, rating) VALUES (?, ?, ?, ?)",
            (user_id, restaurant_id, comment, rating)
        )
        db.commit()

        return jsonify({"message": "Review added successfully"}), 201

    except Exception as e:
        db.rollback()
        print(f"Error adding review: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@food_bp.route("/restaurant/", methods=["GET"])
@jwt_required()
def get_restaurant_with_reviews():
    """Get detailed restaurant info with all reviews"""
    try:
        restaurant_id = request.args.get("id")

        if not restaurant_id:
            return jsonify({"error": "restaurant_id (id) is required"}), 400

        db = get_db()
        cursor = db.cursor()

        # Step 1: Get restaurant details
        cursor.execute("SELECT * FROM restaurant WHERE id = ?", (restaurant_id,))
        restaurant = cursor.fetchone()

        if not restaurant:
            return jsonify({"error": "Restaurant not found"}), 404

        restaurant_info = dict(restaurant)

        # Step 2: Get all reviews for the restaurant
        cursor.execute("""
            SELECT r.rating, r.comment, u.id AS user_id, u.name AS username, u.profile_pic
            FROM review r
            JOIN users u ON r.user_id = u.id
            WHERE r.restaurant_id = ?
        """, (restaurant_id,))

        reviews = [
            {
                "user_id": row["user_id"],
                "username": row["username"],
                "profile_pic": row["profile_pic"],
                "rating": row["rating"],
                "comment": row["comment"]
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "restaurant": restaurant_info,
            "reviews": reviews
        }), 200

    except Exception as e:
        print(f"\nError! Failed to fetch restaurant details: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@food_bp.route("/search/<int:room_id>", methods=["GET"])
@jwt_required()
def search_restaurants_by_room(room_id):
    try:
        user_id = get_jwt()["id"]
        db = get_db()
        cursor = db.cursor()

        # ✅ Step 1: Ensure user is part of the specified room
        cursor.execute(
            "SELECT 1 FROM room_members WHERE user_id = ? AND room_id = ?",
            (user_id, room_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You are not part of this room"}), 403

        # ✅ Step 2: Get location and cuisine from the room
        cursor.execute("SELECT location, cuisine FROM rooms WHERE id = ?", (room_id,))
        room = cursor.fetchone()

        if not room:
            return jsonify({"error": "Room not found"}), 404

        location = room["location"]
        cuisine = room["cuisine"]

        # ✅ Step 3: Check cached generated_food_list
        cursor.execute("SELECT generated_food_list FROM room_preference WHERE room_id = ?", (room_id,))
        pref = cursor.fetchone()

        if pref and pref["generated_food_list"] and pref["generated_food_list"] != "[]":
            return jsonify(json.loads(pref["generated_food_list"])), 200

        # ✅ Step 4: Generate and save results
        results = search_restaurants_by_location_and_cuisine(location, cuisine)

        # Ensure the row exists
        cursor.execute("SELECT 1 FROM room_preference WHERE room_id = ?", (room_id,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO room_preference (room_id, generated_food_list) VALUES (?, ?)",
                (room_id, json.dumps(results))
            )
        else:
            cursor.execute(
                "UPDATE room_preference SET generated_food_list = ? WHERE room_id = ?",
                (json.dumps(results), room_id)
            )

        db.commit()
        print(results)
        return jsonify(results), 200

    except Exception as e:
        db.rollback()
        print(f"Error in search route: {e}")
        return jsonify({"error": "Internal Server Error"}), 500



