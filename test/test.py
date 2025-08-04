from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "super-secret-key"  # Change this in production!

jwt = JWTManager(app)

# Dummy users database (Replace with real DB)
USERS = {"admin": "password123", "user": "mypassword"}


# 🔹 Login Route - Returns JWT Token
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or request.form
    username = data.get("username")
    password = data.get("password")

    if username in USERS and USERS[username] == password:
        access_token = create_access_token(
            identity=username, additional_claims={"id": "1"}
        )
        return jsonify(access_token=access_token)

    return jsonify({"error": "Invalid credentials"}), 401


# 🔹 Protected Route - Requires JWT
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    # print(current_user)
    return jsonify(
        {
            "message": f"Hello, {current_user}! You accessed a protected route.",
            # "message": f"Hello, ??? ! You accessed a protected route.",
            "info": get_jwt(),
        }
    )


@app.route("/protected2", methods=["GET"])
# @jwt_required()
def protected2():
    # current_user = get_jwt_identity()
    # print(current_user)
    return jsonify(
        {
            # "message": f"Hello, {current_user}! You accessed a protected route.",
            "message": f"Hello, ??? ! You accessed a protected route.",
            # "info": get_jwt(),
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
