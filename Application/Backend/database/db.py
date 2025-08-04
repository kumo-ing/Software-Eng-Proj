import os
import sqlite3
from flask import g

DATABASE_PATH = "./app1.db"

def get_db():
    """Ensures a single connection per request using Flask's `g` object."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Closes the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def is_token_allowed(jwt_data):
    """Checks if the provided token is allowed."""
    jti = jwt_data["jti"]
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM users WHERE jti = ?", (jti,))
    return cursor.fetchone() is not None

def create_table():
    """Creates tables if they do not exist."""
    if os.path.exists(DATABASE_PATH):
        return

    table_schemas = [
        """CREATE TABLE IF NOT EXISTS "users" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            number TEXT NULL,
            password TEXT NOT NULL,
            profile_pic TEXT NOT NULL DEFAULT 'default.jpg',
            jti TEXT NULL
            , login_type TEXT NOT NULL DEFAULT 'system'
        )""",
        """CREATE TABLE IF NOT EXISTS "rooms" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT,
            time TEXT,
            location TEXT, restaurant TEXT,
            room_code TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'active'
        )""",
        """CREATE TABLE IF NOT EXISTS "room_members" (
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            nickname TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, room_id)
        )""",
        """CREATE TABLE IF NOT EXISTS "friends" (
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            PRIMARY KEY (user1_id, user2_id),
            FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
        )""",
        """CREATE TABLE IF NOT EXISTS "restaurant" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            operating_hours TEXT NOT NULL
        )""",
        """CREATE TABLE IF NOT EXISTS "review" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            restaurant_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (restaurant_id) REFERENCES restaurant(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (restaurant_id, user_id)
        )""",
        """CREATE TABLE IF NOT EXISTS "chat" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            datetime TEXT NOT NULL,
            message TEXT NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )""",
        """CREATE TABLE "room_preference" (
            room_id INTEGER PRIMARY KEY,
            "time_preferences_list" TEXT NOT NULL default '[]',
            "cuisine_list" TEXT NOT NULL DEFAULT '[]', 
            "location_list" TEXT NOT NULL DEFAULT '[]', 
            generated_food_list TEXT NOT NULL DEFAULT '[]', 
            confirmed_user TEXT NOT NULL DEFAULT '[]',
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        )""",
    ]

    try:
        with sqlite3.connect(DATABASE_PATH) as conn:
            cursor = conn.cursor()
            for schema in table_schemas:
                cursor.execute(schema)

            cursor.execute("SELECT 1 FROM users WHERE email = 'system@internal'")
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO users (id, name, email, number, password, profile_pic)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    99999,
                    "SYSTEM",
                    "system@internal",
                    "00000000",
                    "NIL", 
                    "default.jpg"
                ))

            conn.commit()
    except sqlite3.Error as e:
        print(f"Database initialization error: {e}")
