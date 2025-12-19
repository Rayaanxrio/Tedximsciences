# TEDxImScience Dino Game 🎮

A Chrome Dino-style web game themed around TEDxImScience with Firebase authentication and leaderboard functionality.

## Features

- **TEDx-Themed Gameplay**: Jump and duck with a TEDx "X" logo as the player character
- **Letter Obstacles**: Avoid letters from "TEDxImScience" spelled out as obstacles
- **Fullscreen Mode**: Chrome Dino-style fullscreen gameplay experience
- **Firebase Integration**: User authentication and Firestore database for score tracking
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Leaderboard**: View top 10 players with their scores
- **Offline Support**: Game continues to work offline after initial login
- **Smooth Animations**: Clean transitions and particle effects
- **Fast-Paced Action**: More frequent obstacles for engaging gameplay
- **Added security**: Disabled dev tools / Console

## Getting Started

### Prerequisites

- A Firebase account ([Create one here](https://firebase.google.com/))
- A web browser
- A local web server (for development)

### Firebase Setup

#### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `tedximscience-game` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click on **Sign-in method** tab
3. Enable **Anonymous** authentication
4. Click **Save**

#### 3. Create Firestore Database

1. In Firebase Console, go to **Firestore Database** → **Create database**
2. Select **Start in production mode** (we'll add rules next)
3. Choose a location (select closest to your users)
4. Click **Enable**

#### 4. Configure Firestore Rules

1. In Firestore Database, click on **Rules** tab
2. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own document
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
  }
}
```

3. Click **Publish**

#### 5. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname: `TEDxImScience Game`
5. Copy the Firebase configuration object

#### 6. Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Local Development

#### Option 1: Using Python

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open http://localhost:8000 in your browser.

#### Option 2: Using Node.js (http-server)

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

Then open http://localhost:8000 in your browser.

#### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## How to Play

1. **Loading Screen**: Wait for the game to load
2. **Login**: Enter your details (Name, Class, Department, Semester, Phone)
3. **Controls**:
   - **Spacebar** or **↑** or **Tap** = Jump
   - **↓** or **Swipe Down** = Duck
   - **ESC** = Pause
4. **Objective**: Avoid obstacles and score as high as possible!

## Project Structure

```
tedx/
├── index.html           # Main HTML file
├── styles.css           # All styling and animations
├── firebase-config.js   # Firebase configuration
├── auth.js              # Authentication and Firestore functions
├── game.js              # Game engine and mechanics
├── main.js              # Main application controller
└── README.md            # Documentation
```

## Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --tedx-red: #E62B1E;
    --tedx-black: #000000;
    --tedx-white: #FFFFFF;
}
```

### Game Speed

Modify game configuration in `game.js`:

```javascript
const CONFIG = {
    INITIAL_SPEED: 6,        // Starting speed
    SPEED_INCREMENT: 0.005,  // Speed increase rate
    MAX_SPEED: 13,           // Maximum speed
    JUMP_FORCE: -12,         // Jump strength
    GRAVITY: 0.6,            // Gravity strength
    OBSTACLE_MIN_GAP: 400,   // Minimum gap between obstacles (ms)
    OBSTACLE_MAX_GAP: 900,   // Maximum gap between obstacles (ms)
};
```

### Obstacles

Add or modify obstacle letters in `game.js`:

```javascript
const OBSTACLE_TYPES = [
    { width: 35, height: 50, color: '#E62B1E', letter: 'T' },
    { width: 35, height: 50, color: '#E62B1E', letter: 'E' },
    // Add more letters from TEDxImScience or custom letters
];
```

## 🔧 Troubleshooting

### Firebase Errors

**Error**: "Firebase: Error (auth/unauthorized-domain)"
- **Solution**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

**Error**: "Missing or insufficient permissions"
- **Solution**: Check your Firestore rules (see step 4 in Firebase Setup)

### Game Not Loading

1. Check browser console for errors (F12)
2. Ensure Firebase configuration is correct
3. Verify you're running the app on a web server (not file://)
4. Clear browser cache and try again

### Authentication Issues

1. Verify Anonymous Authentication is enabled in Firebase
2. Check if you're blocking third-party cookies
3. Try in incognito/private mode

## 📱 Mobile Support

The game is fully responsive and supports:
- Touch controls (tap to jump, swipe down to duck)
- Portrait and landscape orientations
- Mobile-optimized UI

## 🌐 Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init hosting
```

4. Select your Firebase project
5. Set public directory: `.` (current directory)
6. Configure as single-page app: No
7. Don't overwrite existing files

8. Deploy:
```bash
firebase deploy
```
### Netlify

1. Drag and drop your project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository for automatic deployments

## Database Structure

### Users Collection

```javascript
users/{userId}
├── uid: string
├── fullName: string
├── class: string
├── department: string
├── semester: string
├── phone: string
├── highScore: number
├── createdAt: timestamp
└── lastPlayed: timestamp
```


### Created Security Module (`game-security.js`)

**Features Implemented:**

- ✅ **Console Detection**
  - Detects when DevTools is open
  - Shows big red warning message
  - Marks session as compromised
  - Automatic checking every second

- ✅ **DevTools Protection**
  - Disables F12 key
  - Disables Ctrl+Shift+I/J/C
  - Disables right-click context menu
  - Disables Ctrl+U (view source)
  - Obfuscates console methods

- ✅ **Session Tracking**
  - Tracks game start time
  - Monitors score changes
  - Validates score vs time ratio
  - 30-minute session timeout
```

##  Future Enhancements

- [ ] Add sound effects (jump, collision, score)
- [ ] Add background music with mute toggle
- [ ] Implement power-ups (shields, speed boost)
- [ ] Add multiple difficulty levels
- [ ] Create custom obstacle designs
- [ ] Add achievements system
- [ ] Implement social sharing
- [ ] Add multiplayer mode


##  Acknowledgments

- Inspired by the Chrome Dino game
- TEDx branding and color scheme
- Firebase for backend infrastructure

##  Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Firebase Console for errors
4. Ensure Firebase configuration is correct

##  Enjoy Playing!



---

**Note**: Remember to replace the Firebase configuration placeholders with your actual Firebase project credentials before deploying!
