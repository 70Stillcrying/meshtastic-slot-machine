# Meshtastic Lottery System

A real-time lottery system based on the Meshtastic network, which supports automatic device detection and fair prize drawing.
![](https://pic1.imgdb.cn/item/684a487858cb8da5c846941d.jpg)
## 🌟 Features

  - **Automatic Entry** - Automatically join the lottery pool by sending a specific keyword over the Meshtastic network.
  - **Multi-level Prizes** - Configure multiple prize tiers and the corresponding number of winners.
  - **Real-time Status Sync** - The frontend can fetch the participant list, draw status, and results via an HTTP API.
  - **Fair Drawing** - The backend uses a random algorithm to ensure every participant has an equal chance of winning.
  - **User Identification** - Automatically fetches and displays the Meshtastic usernames of participants.
  - **State Reset** - Easily clear all participants and reset the system via an API to start a new lottery.

## 🛠️ Tech Stack & Architecture

### Frontend

  - **Next.js 15** - The React Framework for the Web
  - **TypeScript** - Strongly typed JavaScript
  - **Tailwind CSS** & **shadcn/ui** - For rapidly building modern UIs
  - **Lucide React** - Icon library

### Backend

  - **Python 3.8+**
  - **Flask** & **Flask-CORS** - To provide a lightweight HTTP API service
  - **Meshtastic Python API** - For communicating with Meshtastic hardware devices

#### Backend Core Architecture

To ensure the responsiveness of the web service (API) and continuous listening for Meshtastic messages, the backend uses a multi-threaded architecture:

1.  **Main Thread (Flask App)**:

      * Runs the Flask web server, responsible for receiving and processing HTTP requests from the frontend (e.g., checking status, triggering a draw, resetting the system). This is the primary channel for interacting with the user interface.

2.  **Meshtastic Listener Thread (`meshtastic_thread`)**:

      * An independent background daemon thread (`daemon=True`) is created at startup.
      * This thread is dedicated to connecting to the Meshtastic device via a serial interface (`SerialInterface`) and continuously listening for network messages.
      * It uses the `pubsub` library to subscribe to the `meshtastic.receive` event, passing all received data packets to the `on_meshtastic_receive` callback function.
      * **This design separates time-consuming I/O operations (waiting for LoRa messages) from the main thread, which prevents the web service from blocking and ensures the API can respond quickly at all times.**

3.  **Draw Execution Thread**:

      * When an administrator triggers a draw via the API, **another temporary background thread** is created to execute the `run_lottery` function.
      * This prevents the drawing process (which includes shuffling and delays) from blocking the API route, allowing the frontend to immediately receive an "Draw has started" response for a smooth user experience.

#### Meshtastic Interface Interaction Logic

The backend's interaction with Meshtastic is entirely event-driven:

  - **Connection & Subscription**: At startup, the listener thread attempts to connect to the device and subscribes to two core event types:

      - `meshtastic.connection`: Used to monitor the connection status with the device (e.g., "established" or "lost") and print logs to the console.
      - `meshtastic.receive`: **This is the most important event.** It is triggered whenever a data packet is received from the Meshtastic network.

  - **Message Handling (`on_meshtastic_receive` function)**:

      - **Lottery Participation**: The function checks if a received packet is a text message (`TEXT_MESSAGE_APP`). If so, it further checks if the message content includes the predefined keyword (`LOTTERY_KEYWORD`, default is "I want to enter"). If it matches, the sender's ID is added to the `lottery_participants` set to register them.
      - **User Info Update**: The function also listens for node info packets (`NODEINFO_APP`). When such a packet is received, it parses the user's ID and long name, updating them in the `node_info_map` dictionary. This allows the system to display user-friendly names instead of machine IDs for participants and winners.

## 📦 Installation and Running

### Prerequisites

  - Node.js 18+
  - Python 3.8+
  - A Meshtastic device connected to your computer

### 1\. Clone the project

```bash
git clone <repository-url>
cd meshtastic-lottery
```

### 2\. Install backend dependencies

```bash
pip install flask flask-cors meshtastic
```

### 3\. Install frontend dependencies

```bash
npm install
```

### 4\. Start the backend server

> **Note**: Ensure your filename matches the command. Based on the provided code, the filename is `background_server.py`.

```bash
python background_server.py
```

The backend server will start at `http://127.0.0.1:5000`.

### 5\. Start the frontend development server

```bash
npm run dev
```

The frontend application will start at `http://localhost:3000`.

## 📡 API Documentation

### GET `/status`

Fetches the complete current state of the system, used for frontend polling updates.

**Example Response:**

```json
{
  "status": "running",
  "participants": [
    {
      "id": "!a1b2c3d4",
      "name": "John Doe"
    },
    {
      "id": "!e5f6g7h8",
      "name": "Jane Smith"
    }
  ],
  "participantCount": 2,
  "keyword": "I want to enter",
  "prizes": {
    "First Prize": 1,
    "Second Prize": 3,
    "Third Prize": 5
  },
  "inProgress": false,
  "results": {
      "First Prize": [{"id": "!a1b2c3d4", "name": "John Doe"}]
  },
  "lastUpdate": 1672531200.123
}
```

### POST `/trigger-draw`

Triggers the prize draw. The drawing process will run in a background thread.

**Request Body:** (empty)

**Success Response:**

```json
{
  "message": "Draw has started"
}
```

**Failure Response (Example):**

```json
{
  "error": "No participants"
}
```

### POST `/reset`

Resets the system state, clearing all participants, draw results, and stopping any ongoing draws.

**Request Body:** (empty)

**Response:**

```json
{
  "message": "Lottery state has been reset"
}
```
## run time show
![](https://pic1.imgdb.cn/item/684a4a7758cb8da5c8469492.png)

## 🤝 Contribution Guidelines

Contributions are welcome\!

1.  Fork this project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

## 🙏 Acknowledgments

  - [Meshtastic](https://meshtastic.org/) - The open-source, off-grid, mesh network project.
  - [Next.js](https://nextjs.org/) - The React Framework for the Web.
  - [shadcn/ui](https://ui.shadcn.com/) - A great UI component library.

## 📞 Support

If you encounter problems or have suggestions, please:

1.  Check the [issues] page.
2.  Create a new Issue.
3.  Contact the project maintainer.

-----

**Disclaimer:** This project is for educational and entertainment purposes only. Please ensure you comply with local laws and regulations during use.