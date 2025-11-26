# Firebase Setup Guide

## Understanding the Errors

The errors you're seeing mean:

1. **"your-api-key" errors**: Your Firebase configuration is using placeholder values instead of real credentials
2. **400 Bad Request**: Firebase is rejecting requests because the API key is invalid
3. **Listener error**: Usually a browser extension issue (can be ignored)

## Quick Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the `</>` (Web) icon to add a web app
5. Register your app (give it a nickname like "HealthCare Portal")
6. Copy the `firebaseConfig` object values

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "my-project.firebaseapp.com",
  projectId: "my-project",
  storageBucket: "my-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 3. Create Your .env File

1. In the root directory of your project, create a file named `.env`
2. Copy the values from Firebase into the `.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Important**: Replace the values with your actual Firebase config values!

### 4. Enable Firebase Services

#### Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

#### Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Start in "test mode" (we'll set up security rules later)
4. Choose a location closest to your users
5. Click "Enable"

#### Enable Storage
1. Go to "Storage"
2. Click "Get started"
3. Start in "test mode"
4. Use the same location as Firestore
5. Click "Done"

### 5. Set Up Security Rules

#### Firestore Security Rules
Go to Firestore Database > Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Patients can read their own patient document
    match /patients/{patientId} {
      allow read: if request.auth != null && 
        (request.auth.uid == patientId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin']);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin'];
      
      // Subcollections
      match /medicalRecords/{recordId} {
        allow read: if request.auth != null && 
          (request.auth.uid == patientId || 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin']);
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin'];
      }
      
      match /vaccinations/{vaccinationId} {
        allow read: if request.auth != null && 
          (request.auth.uid == patientId || 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin']);
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin'];
      }
      
      match /appointments/{appointmentId} {
        allow read: if request.auth != null && 
          (request.auth.uid == patientId || 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin']);
        allow write: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['doctor', 'admin'];
      }
    }
  }
}
```

#### Storage Security Rules
Go to Storage > Rules and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /patients/{patientId}/{allPaths=**} {
      allow read: if request.auth != null && 
        (request.auth.uid == patientId || 
         request.auth.token.role in ['doctor', 'admin']);
      allow write: if request.auth != null && 
        (request.auth.uid == patientId || 
         request.auth.token.role in ['doctor', 'admin']);
    }
  }
}
```

### 6. Restart Your Dev Server

After creating the `.env` file:
1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`

The app should now connect to Firebase successfully!

## Troubleshooting

### Still seeing "your-api-key" errors?
- Make sure your `.env` file is in the root directory (same level as `package.json`)
- Make sure variable names start with `VITE_`
- Restart your dev server after creating/updating `.env`
- Check that there are no spaces around the `=` sign in `.env`

### Getting 400 Bad Request?
- Verify your API key is correct
- Make sure Authentication is enabled in Firebase Console
- Check that your project ID matches

### Getting permission errors?
- Make sure Firestore and Storage security rules are set up
- Verify you're signed in with a user that has the correct role

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Make sure all Firebase services are enabled
4. Check that security rules are properly configured

