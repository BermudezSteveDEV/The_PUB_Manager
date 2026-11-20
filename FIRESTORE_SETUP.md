# PUB Manager - Firestore REST API Setup Guide

## Overview
This guide will help you migrate your PUB Manager application from local storage to Firebase Firestore with a REST API backend.

## What's New
- **Backend REST API** using Express.js
- **Firebase Firestore** for cloud data storage
- **Real-time data synchronization** across devices
- **Free tier support** with Firestore
- **Scalable architecture** ready for production

## Prerequisites
- Node.js (v14 or higher) - [Download](https://nodejs.org/)
- Firebase Project - [Create Project](https://console.firebase.google.com/)
- npm (comes with Node.js)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter your project name (e.g., "PUB Manager")
4. Accept the terms and click "Create project"
5. Wait for your project to initialize

## Step 2: Set Up Firestore Database

1. In Firebase Console, click on your project
2. In the left sidebar, go to **Build → Firestore Database**
3. Click **Create database**
4. Choose **Start in test mode** (for development)
5. Select a region (e.g., us-central1)
6. Click **Create**

> ⚠️ **Security Note**: Test mode allows anyone to read/write. For production, set up proper security rules.

## Step 3: Create a Service Account

1. Go to Firebase Console → Project Settings (⚙️ icon)
2. Click on **Service Accounts** tab
3. Click **Generate new private key**
4. Save the JSON file as `firebaseServiceAccount.json`
5. Move this file to the `backend` folder

**Security Warning**: Keep this file secret! Never commit to public repos.

## Step 4: Set Up the Backend

### 4.1 Install Dependencies

```bash
cd backend
npm install
```

### 4.2 Create Environment File

Create a `.env` file in the `backend` folder:

```
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
PORT=3000
NODE_ENV=development
```

Replace `your-project` with your actual Firebase project ID.

### 4.3 Start the Backend Server

```bash
npm start
```

You should see:
```
PUB Manager API running on http://localhost:3000
Health check: http://localhost:3000/api/health
```

Test the API:
```bash
curl http://localhost:3000/api/health
```

## Step 5: Update Frontend to Use API

### 5.1 Update HTML Files

Add these two scripts to your HTML files (before closing `</body>` tag):

```html
<!-- Include API Service -->
<script src="api-service.js"></script>

<!-- Use Firestore Version of app.js -->
<script src="app-firestore.js"></script>
```

**Replace the old `app.js` reference with `app-firestore.js`**

### 5.2 Update Forms to Use Async Functions

Example for adding a defect (defect-add.html):

```javascript
// OLD CODE:
// const defect = { jiraId, description, priority };
// AppState.addDefect(defect);

// NEW CODE (async):
async function submitDefect() {
  try {
    const defect = {
      jiraId: document.getElementById('jiraId').value,
      description: document.getElementById('description').value,
      priority: document.getElementById('priority').value
    };
    
    await AppState.addDefect(defect);
    alert('Defect added successfully!');
    // Reset form and close modal
    document.getElementById('defectForm').reset();
    closeModal();
    AppState.updateDashboard();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

## Step 6: Update Login Page

The `login.html` page needs to use the new API. Update the login handler:

```javascript
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await api.login(email, password);
    
    // Store user in session
    sessionStorage.setItem('loggedInUser', JSON.stringify(response.user));
    
    // Redirect to dashboard
    window.location.href = 'index.html';
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}
```

## Step 7: Configure API Base URL

In your HTML files, set the API URL before importing api-service.js:

```html
<!-- For development (local backend) -->
<script>
  window.API_BASE_URL = 'http://localhost:3000';
</script>

<!-- For production (deployed backend) -->
<!-- 
<script>
  window.API_BASE_URL = 'https://your-api-domain.com';
</script>
-->

<script src="api-service.js"></script>
```

Update `api-service.js` to use this global variable:

```javascript
const api = new FirestoreAPI(window.API_BASE_URL || 'http://localhost:3000');
```

## Step 8: Data Migration

To migrate existing localStorage data to Firestore:

1. Export your data from localStorage using browser DevTools:
   ```javascript
   // In browser console
   JSON.stringify(localStorage)
   ```

2. Create a migration script (`backend/migrate.js`):
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./firebaseServiceAccount.json');
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   ```

## Step 9: Deploy Frontend to Firebase Hosting

1. In your project root, create or update `firebase.json` and `.firebaserc`.
2. Install the Firebase CLI if you have not already:
   ```bash
   npm install -g firebase-tools
   ```
3. Log in and select your Firebase project:
   ```bash
   firebase login
   firebase use --add
   ```
4. Deploy only the frontend:
   ```bash
   firebase deploy --only hosting
   ```

Your frontend will be served from your Firebase Hosting URL.

### Example `firebase.json`

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      ".firebaserc",
      "**/.*",
      "**/node_modules/**",
      "backend/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Example `.firebaserc`

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

## Step 10: Deploy the Express Backend to Cloud Run

Your backend is a Node.js Express app and is best deployed to Cloud Run.

1. Create a Dockerfile in `backend/`:
   ```dockerfile
   FROM node:18-slim
   WORKDIR /usr/src/app

   COPY package*.json ./
   RUN npm install --production

   COPY . .

   ENV PORT=8080
   EXPOSE 8080

   CMD ["node", "server.js"]
   ```

2. Build and deploy with `gcloud` (replace `YOUR_PROJECT_ID` and `YOUR_REGION`):
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pub-manager-backend
   gcloud run deploy pub-manager-backend \
     --image gcr.io/YOUR_PROJECT_ID/pub-manager-backend \
     --platform managed \
     --region YOUR_REGION \
     --allow-unauthenticated \
     --set-env-vars FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID.firebaseio.com
   ```

3. After deployment, note the Cloud Run service URL and set it in your frontend:
   ```html
   <script>
     window.API_BASE_URL = 'https://YOUR_CLOUD_RUN_URL';
   </script>
   ```

### Important Cloud Run notes

- Cloud Run provides credentials automatically when the service account is attached.
- Do not deploy your local `firebaseServiceAccount.json` to Cloud Run.
- If you want to use a custom Firebase service account, set `GOOGLE_APPLICATION_CREDENTIALS` to that file path in the container.
   
   const db = admin.firestore();
   
   async function migrate() {
     // Copy your localStorage data here and upload to Firestore
     // Example:
     // const defects = [...]; // your defect data
     // for (const defect of defects) {
     //   await db.collection('defects').add(defect);
     // }
   }
   
   migrate().then(() => {
     console.log('Migration complete');
     process.exit(0);
   });
   ```

3. Run the migration:
   ```bash
   node migrate.js
   ```

## Step 9: Set Up Firestore Security Rules (Production)

Replace the default security rules to protect your data:

1. Go to Firebase Console → Firestore → Rules
2. Replace with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all operations
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Users collection - users can only read/write their own doc
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Defects
- `GET /api/defects` - Get all defects
- `POST /api/defects` - Add defect
- `PUT /api/defects/{id}` - Update defect
- `DELETE /api/defects/{id}` - Delete defect

### Change Requests
- `GET /api/change-requests` - Get all CRs
- `POST /api/change-requests` - Add CR
- `PUT /api/change-requests/{id}` - Update CR
- `DELETE /api/change-requests/{id}` - Delete CR

### Other Collections
- `/api/intakes` - Intake management
- `/api/stories` - Story management
- `/api/epics` - Epic management
- `/api/tasks` - Task management
- `/api/resolved` - Resolved items
- `/api/activities` - Activity logs

## Deployment Options

### Deploy Backend to Firebase Cloud Functions

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize Firebase:
   ```bash
   firebase init functions
   ```

3. Deploy:
   ```bash
   firebase deploy --only functions
   ```

### Deploy to Other Platforms
- Heroku
- Vercel
- AWS
- DigitalOcean
- Render
- Fly.io

## Troubleshooting

### "API not responding"
- Check backend is running: `npm start`
- Verify correct PORT in `.env`
- Check firewall/antivirus isn't blocking port 3000

### "Firebase authentication error"
- Verify `firebaseServiceAccount.json` exists in backend folder
- Check Firebase project ID matches in `.env`
- Ensure Firestore database is created

### "CORS errors"
- Backend is running but frontend can't reach it
- Check both are on same network
- For mobile/remote access, deploy backend to cloud

### "Data not persisting"
- Check Firestore rules allow read/write
- Verify API responses show success: true
- Check browser console for network errors

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Create Firestore database
3. ✅ Generate service account key
4. ✅ Install dependencies
5. ✅ Start backend server
6. ✅ Update frontend HTML
7. ✅ Test API connections
8. ✅ Migrate existing data
9. ✅ Deploy to production

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Database Guide](https://firebase.google.com/docs/firestore)
- [Express.js Guide](https://expressjs.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## Security Checklist

- [ ] Moved `firebaseServiceAccount.json` to `.gitignore`
- [ ] Set up proper Firestore security rules
- [ ] Implemented proper authentication in login page
- [ ] Encrypted passwords (use bcrypt in production)
- [ ] Deployed backend to secure HTTPS endpoint
- [ ] Enabled CORS only for trusted domains
- [ ] Validated all API inputs on backend
- [ ] Set up rate limiting to prevent abuse

---

**Happy coding! 🚀**
