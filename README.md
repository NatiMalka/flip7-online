# Flip 7 Online Game

A modern, responsive desktop web version of the "Flip 7" card game with real-time multiplayer support.

## 🎮 Features

- **Real-time Multiplayer**: Join private rooms with room codes
- **Solo Mode**: Challenge yourself to reach 200+ points in 5 rounds
- **Press-Your-Luck Mechanics**: Based on official Flip 7 rules
- **Beautiful UI**: Modern design with smooth animations
- **Card Types**: Number, Action, and Modifier cards
- **Flip 7 Auto-Win**: Special cards that grant automatic round wins + 15pt bonus

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore, Functions, Hosting)
- **Build Tool**: Vite
- **State Management**: React Context + Firebase real-time listeners

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flip7-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Firebase Functions
   - Copy your Firebase config

4. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   Edit `.env.local` and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Game Rules

### Basic Rules
- Players take turns drawing cards
- Number cards (1-7) add to your score
- Action cards have special effects
- Modifier cards multiply your score
- Bust if your total exceeds 7
- Flip 7 cards = automatic round win + 15pt bonus

### Card Types
- **Number Cards**: Values 1-7, add to score
- **Action Cards**: 
  - Freeze: Skip next turn
  - Flip Three: Draw 3 cards
  - Second Chance: Continue after bust
- **Modifier Cards**:
  - ×2: Double current score
  - ×3: Triple current score
  - Reverse: Reverse turn order

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Button component
│   ├── Card.tsx        # Card display component
│   ├── Loading.tsx     # Loading spinner
│   ├── Modal.tsx       # Modal dialog
│   └── index.ts        # Component exports
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # Firebase and API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## 🎨 Customization

### Colors
The game uses a custom color palette defined in `tailwind.config.js`:
- Primary: Red shades for main actions
- Secondary: Blue shades for secondary actions
- Card colors: Red, blue, green, yellow, purple for different card types

### Animations
Custom animations are defined in the Tailwind config:
- `flip`: Card flip animation
- `shake`: Bust effect
- `bounce-in`: Element entrance
- `slide-in`: Smooth transitions

## 🚀 Deployment

### Firebase Hosting
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎮 Game Status

**Phase 1 Complete**: ✅ Project setup and foundation
- React + TypeScript + Vite setup
- Tailwind CSS configuration
- Basic UI components
- Type definitions
- Firebase configuration

**Next Phase**: Core game logic and data models

---

Built with ❤️ using React, TypeScript, and Firebase
