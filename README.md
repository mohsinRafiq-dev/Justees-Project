# Justees - Clothing Portfolio Website

A modern, production-ready clothing portfolio website built with React, Vite, Tailwind CSS, and Firebase. Features WhatsApp-based ordering and a secure admin panel.

## 🚀 Features

- **Public Product Gallery** - Responsive product showcase for customers
- **WhatsApp Ordering** - Direct ordering via WhatsApp links
- **Admin Panel** - Secure dashboard for product management
- **Firebase Backend** - Serverless architecture
  - Authentication (Admin only)
  - Firestore Database
  - Cloud Storage for images
  - Firebase Hosting
- **Modern UI** - Built with Tailwind CSS
- **Protected Routes** - Admin-only access control

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 7
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **Language:** JavaScript (ES6+)

## 📁 Project Structure

```
justees/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/      # Navbar, Footer, Loader
│   │   ├── products/    # Product cards, grids
│   │   └── admin/       # Admin-specific components
│   ├── pages/           # Page components
│   │   └── admin/       # Admin pages
│   ├── contexts/        # React Context (Auth)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Firebase services
│   ├── routes/          # Route configuration
│   └── utils/           # Helper functions
├── public/              # Static assets
└── firebase.json        # Firebase configuration
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Git

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Justees
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable the following services:
   - **Authentication** → Email/Password
   - **Firestore Database** → Start in production mode
   - **Storage** → Start in production mode
4. Get your Firebase config from Project Settings

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_WHATSAPP_NUMBER=1234567890
VITE_BUSINESS_NAME=Justees
```

### 4. Firebase CLI Setup

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:

- Firestore
- Storage
- Hosting

### 5. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 🚀 Development

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📦 Build & Deploy

```bash
npm run build
npm run deploy
```

Or manually:

```bash
npm run build
firebase deploy
```

## 🔐 Security

- **Firestore Rules:** Public read, admin write only
- **Storage Rules:** Public read, admin upload/delete only
- **Admin Routes:** Protected with Firebase Authentication
- **Environment Variables:** Never commit `.env` to Git

## 📱 WhatsApp Integration

Orders are sent via WhatsApp Web/App links. Update your WhatsApp number in `.env`:

```env
VITE_WHATSAPP_NUMBER=1234567890
```

## 🎨 Customization

### Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#1f2937',
      secondary: '#3b82f6',
      accent: '#f59e0b',
    },
  },
}
```

### Business Name

Update in `.env`:

```env
VITE_BUSINESS_NAME=Your Business Name
```

## 📄 License

MIT

---

Built with ❤️ using React + Firebase
