# SafeSys: An IoT-Enabled Anti-Theft Locker System

**Winner - First Place, Hardware Category | HackED Beta 2024**

**Team Members:** Ihsan Aziz, Suvir Duggal, Arnav Kumar, Sahibjot Singh, Jaskaran Singh

**Project Summary:** SafeSys is an integrated hardware and software solution designed to enhance the security of personal lockers. By leveraging an IoT-enabled microcontroller and a custom software stack, the system provides real-time access notifications and administrative oversight, addressing the security vulnerabilities of traditional lock systems.

---

## Demonstration

![SafeSys in Action](.github/assets/safesys-demo.gif)
*This demonstration shows a locker access event triggering an instant push notification to the user's mobile device.*

## Problem Statement

The security of personal lockers in public spaces like campuses relies on conventional mechanical locks, which are susceptible to theft and provide no mechanism for real-time monitoring. Users have no way of knowing their locker has been compromised until after the fact, and administrators lack the tools to track unauthorized access events effectively.

## System Overview and Solution

SafeSys addresses these limitations by retrofitting lockers with a smart monitoring system. The core of the system is a microcontroller-driven hardware unit that detects the locker's door state. Upon an access event, the device communicates with a central server, which then relays an immediate alert to the registered user's mobile application. This creates a closed-loop system that provides instant security feedback and logs all access events for administrative review.

## Core Features

* **Real-Time Event Notification:** Users receive instant push notifications on their mobile device the moment their locker is opened.
* **Hardware-Driven Detection:** The system utilizes a custom circuit with MUX switches and an ESP32/Arduino microcontroller for reliable and precise state detection.
* **Centralized Administrative Dashboard:** A web-based interface for administrators to monitor access logs, manage users, and identify anomalous activity.
* **Secure API Communication:** All communication between the hardware, server, and mobile client is handled through a secure API.

## Technical Architecture

The system is architected into three primary components: the embedded hardware unit, a backend server, and a cross-platform mobile application.

| Component | Technology |
| :--- | :--- |
| **Hardware** | ESP32 (or Arduino), MUX Switches, Sensors |
| **Firmware** | C++ (Arduino Framework) |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase, MongoDB, PostgreSQL |
| **Mobile App** | React Native, Flutter |
| **Cloud & Hosting**| Google Cloud, AWS, Vercel |

*(Optional but highly recommended: Create a simple diagram showing the data flow: Hardware -> Wi-Fi -> Backend API -> Database & Push Notification Service -> Mobile App)*

## Image Gallery

<p align="center">
  <img src=".github/assets/hardware-close-up.png" alt="Hardware Setup" width="48%" />
  <img src=".github/assets/mobile-app-ui.png" alt="Mobile App UI" width="48%" />
</p>
<p align="center">
  <em>Left: The ESP32 and MUX circuit prototype. Right: The user interface of the mobile application.</em>
</p>


## Technical Challenges and Project Learnings

Developing a reliable end-to-end IoT system within the constraints of a hackathon presented several engineering challenges:

* **Hardware Selection and Firmware Development:** Initial design considerations involved selecting a microcontroller with appropriate I/O and network capabilities. We chose the ESP32 for its integrated Wi-Fi module, which required us to thoroughly review the technical datasheets to understand its pinout configurations, power modes, and peripheral interfaces. Firmware development was done using the Arduino framework, which involved consulting various library documentations (e.g., for Wi-Fi management and JSON serialization) to ensure stable, non-blocking code execution.

* **System Integration and API Design:** A primary challenge was establishing a robust communication protocol between the hardware, server, and mobile client. We designed a RESTful API to serve as the integration layer. Defining a clear and efficient data contract (JSON schema) was critical to ensure that sensor data from the device was correctly interpreted by the backend and relayed to the mobile application.

* **End-to-End Debugging and Troubleshooting:** A significant portion of our time was dedicated to debugging the system across its full stack. This involved a multi-stage troubleshooting process:
    * **Hardware Level:** Using a multimeter and serial monitor to diagnose issues with the MUX switch logic and rule out signal noise.
    * **Network Level:** Analyzing API request/response cycles to identify and resolve data transmission errors between the ESP32 and the server.
    * **Software Level:** Debugging the asynchronous flow of push notifications and ensuring state consistency in the mobile application.

This project provided our team with practical experience in rapid prototyping, full-stack development, and the iterative process of debugging a complex IoT system.


