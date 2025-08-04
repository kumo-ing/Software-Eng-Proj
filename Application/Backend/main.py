from flask import Flask,make_response
from flask_cors import CORS
from datetime import datetime
from database.db import close_db, create_table, get_db, is_token_allowed
from flask_jwt_extended import (
    JWTManager,
)

from apis.chat import chat_bp
from apis.food import food_bp
from apis.friends import friend_bp
from apis.room import room_bp
from apis.room_preference import room_preference_bp
from apis.user import users_bp



def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = "super-secret-key"

    jwt = JWTManager(app)
    
    CORS(app, supports_credentials=True, 
         max_age=3600, 
         resources={
            r"/api/*": {"origins": "http://localhost:3000"}
        })


    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return not is_token_allowed(jwt_payload)

    create_table() 

    # test route
    @app.route("/api/")
    def test():
        cur_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return {"success": "test connection successful on " + cur_datetime}

    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(food_bp, url_prefix="/api/foods")
    app.register_blueprint(friend_bp, url_prefix="/api/friends")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(room_bp, url_prefix="/api/rooms")
    app.register_blueprint(room_preference_bp, url_prefix="/api/room_preference")

    @app.teardown_appcontext
    def teardown_db(exception=None):
        close_db()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
