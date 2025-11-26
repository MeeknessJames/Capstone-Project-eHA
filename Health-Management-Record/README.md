# Health Management Record Web Application

A modern, secure health management system built with React and Firebase, designed for patients and healthcare providers.

## 🏥 Features

### For Patients
- View personal health records and medical history
- Track vaccination records and upcoming doses
- View scheduled appointments
- Access uploaded documents (lab results, prescriptions, etc.)

### For Doctors/Admins
- Manage patient profiles and records
- Add and update medical records
- Track vaccination schedules
- Schedule appointments
- Upload and manage patient documents
- Search and filter patients
- View dashboard statistics.

## 🔧 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Firebase
  - Firebase Authentication (role-based access)
  - Firestore Database
  - Firebase Storage (file uploads)
  - Cloud Functions (notifications)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd medireach-cloud
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firebase Storage
   - Copy your Firebase config

4. Configure environment variables
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration values

5. Set up Firestore Security Rules
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

6. Set up Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /patients/{patientId}/{allPaths=**} {
      allow read: if request.auth != null && 
        (request.auth.uid == patientId || 
         resource.metadata.role in ['doctor', 'admin']);
      allow write: if request.auth != null && 
        request.auth.uid == patientId || 
        request.auth.token.role in ['doctor', 'admin'];
    }
  }
}
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard components
│   │   ├── PatientDashboard.jsx
│   │   ├── DoctorDashboard.jsx
│   │   ├── PatientForm.jsx
│   │   ├── PatientProfile.jsx
│   │   ├── MedicalRecordForm.jsx
│   │   ├── VaccinationForm.jsx
│   │   ├── AppointmentForm.jsx
│   │   └── FileUpload.jsx
│   └── ui/                 # UI components (shadcn/ui)
├── integrations/
│   └── firebase/           # Firebase integration
│       ├── config.js       # Firebase configuration
│       ├── auth.js         # Authentication helpers
│       ├── database.js     # Firestore helpers
│       └── storage.js     # Storage helpers
├── pages/                  # Page components
│   ├── Index.jsx
│   ├── Auth.jsx
│   ├── Dashboard.jsx
│   └── NotFound.jsx
└── hooks/                  # Custom hooks
```

## 🔐 Security

- Role-based access control (Patient, Doctor, Admin)
- Firestore security rules
- Firebase Storage security rules
- Secure authentication with Firebase Auth

## 📝 License

MIT
