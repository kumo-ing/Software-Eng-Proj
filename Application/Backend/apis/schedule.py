# from flask import Blueprint, request, jsonify
# from database.writeDB import Database

# group_bp = Blueprint("schedule", __name__)

# group_db = Database("./data/schedule.txt")

# @group_bp.route("/api/schedule/new/", methods=["POST"])
# def create_group():
#     data = request.json
#     schedule_name = data.get("schedule")
#     if schedule_name:
#         group_db.write(schedule_name)
#         return jsonify({"message": "schedule created successfully"}), 200
#     return jsonify({"error": "Invalid input"}), 400

# @group_bp.route("/api/schedule/get/", methods=["GET"])
# def get_groups():
#     return jsonify({"schedules": group_db.read()}), 200
