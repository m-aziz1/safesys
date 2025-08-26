import serial
import requests
import time
import ast

# Serial port configuration
serial_port = 'COM7'  # Arduino's port
baud_rate = 9600  # Arduino baud rate

# Flask server URL
flask_server_url = 'https://geekyblinders.pythonanywhere.com/status'  # Flask server's IP

def main():
    # Open serial port
    with serial.Serial(serial_port, baud_rate) as ser:
        time.sleep(2)  # Give time for the serial connection to establish

        last_status = None  # Variable to store the last received status
        
        while True:
            if ser.in_waiting > 0:  # Check if there's data to read
                line = ser.readline().decode('utf-8').rstrip()  # Read line and decode
                line_list = ast.literal_eval(line)
                print(f"Received from Arduino: {line_list}")  # Print the received line

                # Check if the status has changed
                if line != last_status:
                    # Update the last status
                    last_status = line
                    
                    # Send data to Flask server
                    try:
                            # Send data to Flask server
                            response = requests.post(flask_server_url, json={"status": line})

                            # Check if the request was successful
                            response.raise_for_status()

                            # Try to parse JSON response if the server responds with JSON
                            try:
                                response_data = response.json()  # Parse JSON response
                                print(f"Server response (JSON): {response_data}")
                            except ValueError:
                                # If not JSON, just print the raw text response
                                print(f"Server response (text): {response.text}")
                        
                    except requests.exceptions.HTTPError as http_err:
                        print(f"HTTP error occurred: {http_err}")
                    except requests.exceptions.ConnectionError as conn_err:
                        print(f"Connection error occurred: {conn_err}")
                    except requests.exceptions.Timeout as timeout_err:
                        print(f"Timeout error occurred: {timeout_err}")
                    except requests.exceptions.RequestException as req_err:
                        print(f"Request exception occurred: {req_err}")


if __name__ == '__main__':
    main()
