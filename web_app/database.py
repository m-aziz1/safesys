import sqlite3
import jwt
import os
from datetime import datetime, timedelta
import bcrypt

JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_SECONDS = 3600 * 24 * 20  # Token validity of 30 Days

# Database setup
def initialize_database():
    # Check if database exists, if not create it and define tables
    db_exists = os.path.exists('database.db')
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    if not db_exists:
        # Create users table
        cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                notificationToken TEXT,
                jwt TEXT
            )
        ''')

        # Create lockers table
        cursor.execute('''
            CREATE TABLE lockers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location TEXT NOT NULL,
                issuedTo INTEGER,
                FOREIGN KEY (issuedTo) REFERENCES users (id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            locker INTEGER,
            user INTEGER,
            status TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user) REFERENCES users (id)
        );
        ''')


        conn.commit()
    conn.close()


def signup(name, email, password, notification_token=None):
    """Registers a new user, hashes the password, generates a JWT, and stores it in the database."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Check if email already exists
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        if cursor.fetchone() is not None:
            return False, "Email already exists."

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Insert new user
        cursor.execute("INSERT INTO users (name, email, password, notificationToken) VALUES (?, ?, ?, ?)",
                       (name, email, hashed_password, notification_token))
        user_id = cursor.lastrowid  # Get the newly created user's ID

        # Generate JWT token and update in users table
        token = generate_jwt(user_id)
        cursor.execute("UPDATE users SET jwt = ? WHERE id = ?", (token, user_id))

        conn.commit()
        conn.close()
        return True, token
    except Exception as e:
        print(f"Error in signup: {e}")
        return False, str(e)

def login(email, password):
    """Logs in a user by checking hashed password, generates a new JWT, and updates it in the database."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Fetch user ID and hashed password from database
        cursor.execute("SELECT id, password FROM users WHERE email = ?", (email,))
        result = cursor.fetchone()
        if result is None:
            return False, "Invalid email or password."

        user_id, hashed_password = result

        # Verify the hashed password
        if not bcrypt.checkpw(password.encode('utf-8'), hashed_password):
            return False, "Invalid email or password."

        # Generate a new JWT token and update it in the users table
        token = generate_jwt(user_id)
        cursor.execute("UPDATE users SET jwt = ? WHERE id = ?", (token, user_id))

        conn.commit()
        conn.close()
        return True, token
    except Exception as e:
        print(f"Error in login: {e}")
        return False, str(e)
# JWT Generation function
def generate_jwt(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# JWT Verification function
def verify_jwt(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Initialize the database on module load
initialize_database()
def get_all_users():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "name": row[1], "email": row[2], "password": row[3], "notificationToken": row[4], "jwt": row[5]} for row in users]

def get_all_lockers():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lockers")
    lockers = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "location": row[1], "issuedTo": row[2]} for row in lockers]

def get_all_data():
    """Fetches all records from the users and lockers tables."""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Fetch all data from users table
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()

    # Fetch all data from lockers table
    cursor.execute("SELECT * FROM lockers")
    lockers = cursor.fetchall()

    cursor.execute("SELECT * FROM activity")
    activities = cursor.fetchall()

    conn.close()
    return users, lockers, activities


def add_activity(locker, user, status):
    """Inserts a new activity record with locker, user, and status. Timestamp is added automatically."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Insert a new activity record; timestamp is set automatically
        cursor.execute("""
            INSERT INTO activity (locker, user, status)
            VALUES (?, ?, ?)
        """, (locker, user, status))

        conn.commit()
        conn.close()
        return True, "Activity recorded successfully."
    except Exception as e:
        print(f"Error in add_activity: {e}")
        return False, str(e)

def get_notification_token(user_id):
    """Returns the notification token of a user by their ID."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        cursor.execute("SELECT notificationToken FROM users WHERE id = ?", (user_id,))
        result = cursor.fetchone()

        conn.close()

        if result is not None:
            return result[0]
        else:
            return None  # User not found
    except Exception as e:
        print(f"Error in get_notification_token: {e}")
        return None

def getLockerFromUser(locker_id):

    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Query to get the issuedTo user ID based on the locker ID
        cursor.execute("SELECT id FROM lockers WHERE issuedTo = ?", (locker_id,))
        result = cursor.fetchone()

        conn.close()

        # Return the user ID if found, otherwise indicate locker not assigned
        if result is not None and result[0] is not None:
            return result[0]
        else:
            return None  # No user assigned to this locker
    except Exception as e:
        print(f"Error in getUserFromLocker: {e}")
        return None

def getUserFromLocker(locker_id):
    """Fetches the user ID (issuedTo) associated with a given locker ID."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Query to get the issuedTo user ID based on the locker ID
        cursor.execute("SELECT issuedTo FROM lockers WHERE id = ?", (locker_id,))
        result = cursor.fetchone()

        conn.close()

        # Return the user ID if found, otherwise indicate locker not assigned
        if result is not None and result[0] is not None:
            return result[0]
        else:
            return None  # No user assigned to this locker
    except Exception as e:
        print(f"Error in getUserFromLocker: {e}")
        return None


def get_user_by_id(user_id):
    """Fetch user details by user ID."""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, notificationToken FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {
            "id": result[0],
            "name": result[1],
            "email": result[2],
            "notificationToken": result[3]
        }
    return None

def get_latest_activity(user_id):
    """Retrieve the latest activity for a given user and check its status."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Get the latest activity for the user ordered by timestamp
        cursor.execute("""
            SELECT id, status, timestamp FROM activity
            WHERE user = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (user_id,))
        result = cursor.fetchone()

        conn.close()

        # Check if an activity record was found
        if result:
            activity_id, status, timestamp = result
            if status != "reported" and status != "ignored":
                return True, {"id": activity_id, "timestamp": timestamp}

        return False, None

    except Exception as e:
        print(f"Error in get_latest_activity: {e}")
        return False, None

def ignore_activity(user_id, locker_id):
    """Marks an activity as ignored for a specific locker and user."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Insert ignore entry or update status in activities table (adjust SQL as needed)
        cursor.execute("""
            UPDATE activity
            SET status = 'ignored'
            WHERE user = ? AND locker = ?
        """, (user_id, locker_id))

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error in ignore_activity: {e}")
        return False

def report_issue(user_id, locker_id):

    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE activity
            SET status = 'reported'
            WHERE locker = ? AND user = ?
        """, (locker_id, user_id))

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error in report_issue: {e}")
        return False

def is_locker_available(locker_id):
    """Check if a locker is available (not assigned to any user)."""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Query to check if the locker is available
        cursor.execute("SELECT issuedTo FROM lockers WHERE id = ?", (locker_id,))
        result = cursor.fetchone()

        conn.close()

        # If issuedTo is None, the locker is available
        return result is None or result[0] is None
    except Exception as e:
        print(f"Error in is_locker_available: {e}")
        return False

def vacate_locker(locker_id):
    """Vacate a locker by setting issuedTo to NULL"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute("UPDATE lockers SET issuedTo = NULL WHERE id = ?", (locker_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error vacating locker: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def assign_locker(user_id, locker_id):
    """Assign a locker to a user"""
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute("UPDATE lockers SET issuedTo = ? WHERE id = ?", (user_id, locker_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error assigning locker: {e}")
        return False
    finally:
        cursor.close()
        conn.close()
