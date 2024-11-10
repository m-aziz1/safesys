from flask import Flask, request, jsonify, make_response, redirect, url_for, render_template
import database  # Imports the functions from database.py
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
import requests
from requests.exceptions import ConnectionError, HTTPError


def send_push_message(token, message, extra=None):
    try:
        response = PushClient().publish(
            PushMessage(to=token,
                        body=message,
                        data=extra))
    except PushServerError as exc:
        print(exc)

app = Flask(__name__)
# Signup route
@app.route('/signup', methods=['POST'])
def handle_signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    notification_token = data.get('notificationToken', None)

    # Calls the signup function from database.py
    status, token = database.signup(name, email, password, notification_token)

    if status:
        response = make_response(jsonify(success=True, token=token))
        response.set_cookie('token', token, httponly=True, secure=True, samesite='Strict')
        return response
    else:
        return jsonify(success=False, message="Signup failed, email might already be registered."), 400

# Login route
@app.route('/login', methods=['POST'])
def handle_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Calls the login function from database.py
    status, token = database.login(email, password)

    if status:
        response = make_response(jsonify(success=True, token=token))
        response.set_cookie('token', token, httponly=True, secure=True, samesite='Strict')
        return response
    else:
        return jsonify(success=False, message="Invalid email or password."), 401

# Logout route
@app.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify(success=True, message="Logged out successfully"))
    response.set_cookie('token', '', expires=0)  # Clear the token cookie
    return response

# Vacate route
@app.route('/api/lockers/vacate', methods=['POST'])
def vacate_locker():
    data = request.json
    locker_id = data.get('lockerId')
    user_email = data.get('userId')  # This will be the email from the frontend


    try:
        # Get user ID from email
        user_id = database.get_user_by_id(user_email)

        # Update the locker in the database
        database.vacate_locker(locker_id)

        return jsonify({"success": True}), 200
    except Exception as e:
        print(f"Error in vacate_locker: {e}")
        return jsonify({"error": str(e)}), 500


# Assign route
@app.route('/api/lockers/assign', methods=['POST'])
def assign_locker():
    data = request.json
    locker_id = data.get('lockerId')
    user_email = data.get('userEmail')

    try:
        # Get all users and find the user by email
        users = database.get_all_users()
        user = next((u for u in users if u['email'] == user_email), None)

        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = user['id']

        # Check if locker is available
        if not database.is_locker_available(locker_id):
            return jsonify({"error": "Locker is already occupied"}), 400

        # Assign the locker
        database.assign_locker(user_id, locker_id)

        return jsonify({"success": True}), 200
    except Exception as e:
        print(f"Error in assign_locker: {e}")
        return jsonify({"error": str(e)}), 500


# Protected route to check if authentication works (Optional)
@app.route('/protected', methods=['GET'])
def protected():
    token = request.cookies.get('token')
    if not token:
        return jsonify(success=False, message="Token missing"), 401

    user_id = database.verify_jwt(token)
    if user_id is None:
        return jsonify(success=False, message="Invalid or expired token"), 403

    return jsonify(success=True, message="Access granted to protected route", user_id=user_id)

last_state = None

@app.route('/status', methods=['POST'])
def receive_status():
    global last_state

    user_id = None
    # Get JSON data from the request
    data = request.json


    # Print the received status to the console
    if data and 'status' in data:
        states = data['status']
        changed_indices = []

        if last_state is not None:

            min_length = min(len(last_state), len(states))
            changed_indices = [
                i for i in range(min_length) if last_state[i] != states[i]
            ]

        if len(changed_indices) > 0:
            for index in changed_indices:
                print(f"Notifying Locker {index} User")
                user_id = database.getUserFromLocker(index)
                if user_id:

                    notification_token = database.get_notification_token(user_id)
                    if notification_token:
                        send_push_message(notification_token, "Locker Activity Detected!")
                        database.add_activity(index, user_id, "detected")
                    else:
                        print(f"No notification token found for user {user_id}")
                else:
                    print(f"No user assigned to locker {index}")

            print()
        last_state = states

        return f"Last State: {last_state}", 200
    else:
        return 'Invalid data', 400

@app.route('/showData', methods=['GET'])
def show_data():
    try:
        # Retrieve all data from the database
        users, lockers, activities = database.get_all_data()

        # Convert users and lockers data into JSON-serializable format
        users_serialized = [
            {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "password": user[3].decode('utf-8') if isinstance(user[3], bytes) else user[3],
                "notificationToken": user[4],
                "jwt": user[5]
            } for user in users
        ]
        lockers_serialized = [
            {
                "id": locker[0],
                "location": locker[1],
                "issuedTo": locker[2]
            } for locker in lockers
        ]
        activity_serialized = [
            {
                "id": activa[0],
                "locker": activa[1],
                "user": activa[2],
                "status": activa[3],
                "timestamp": activa[4],
            } for activa in activities
            ]

        # Return as JSON response
        return jsonify({"users": users_serialized, "lockers": lockers_serialized, "activity": activity_serialized}), 200
    except Exception as e:
        print(f"Error in show_data: {e}")
        return jsonify({"error": "Unable to retrieve data"}), 500

@app.route('/', methods=['GET'])
def home():
    try:
        email = request.args.get('email')
        password = request.args.get('password')

        # Check for admin credentials
        if email == "admin@example.com" and password == "adminpassword":
            return "<script>alert('Successful admin login'); window.location.href = '/dashboard';</script>"

        return render_template('login.html')

    except Exception as e:
        # Log the error or handle it as needed
        return f"An error occurred: {e}", 500

@app.route('/validate_jwt', methods=['POST'])
def validate_jwt():
    data = request.json
    token = data['token']
    if not token:
        return jsonify({"status": False, "jwt": "Invalid"}), 401

    user_id = database.verify_jwt(token)
    if user_id is None:
        return jsonify({"status": False, "jwt": "Invalid"}), 403

    # Fetch user details from the database
    user = database.get_user_by_id(user_id)
    if not user:
        return jsonify({"status": False, "jwt": "Invalid"}), 403

    locker = database.getLockerFromUser(user['id'])  # Get locker ID, or None if not assigned
    return jsonify({
        "status": True,
        "jwt": "Valid",
        "username": user['name'],
        "user": user['id'],
        "locker": locker
    })

@app.route('/latest_activity', methods=['POST'])
def latest_activity():
    data = request.json
    user_id = data.get('user')

    if not user_id:
        return jsonify({"status": False, "message": "User ID is required"})

    # Call the database function to get the latest activity for the user
    activity_status, activity_data = database.get_latest_activity(user_id)

    if activity_status:
        return jsonify({"status": True, **activity_data})
    else:
        return jsonify({"status": False})

@app.route('/ignore', methods=['POST'])
def ignore_activity():
    data = request.json
    user_id = data.get('user')
    locker_id = data.get('locker')

    if not user_id or not locker_id:
        return jsonify({"success": False, "message": "User ID and Locker ID are required"}), 400

    ignore_status = database.ignore_activity(user_id, locker_id)

    if ignore_status:
        return jsonify({"success": True, "message": "Activity ignored successfully"}), 200
    else:
        return jsonify({"success": False, "message": "Failed to ignore activity"}), 500

# Dashboard route
@app.route('/dashboard', methods=['GET'])
def dashboard():
    return render_template('dashboard.html')


@app.route('/report', methods=['POST'])
def report_issue():
    data = request.json
    user_id = data.get('user')
    locker_id = data.get('locker')

    if not user_id or not locker_id:
        return jsonify({"success": False, "message": "User ID and Locker ID are required"}), 400

    report_status = database.report_issue(user_id, locker_id)

    if report_status:
        return jsonify({"success": True, "message": "Issue reported successfully"}), 200
    else:
        return jsonify({"success": False, "message": "Failed to report issue"}), 500

if __name__ == '__main__':
    app.run(debug=True)  # Change port if needed
