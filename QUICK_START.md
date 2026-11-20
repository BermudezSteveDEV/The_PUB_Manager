# PUB Manager Firestore - Quick Start

## 🚀 Quick 5-Minute Setup

### 1. Get Firebase Service Account
```
Firebase Console → Project Settings → Service Accounts → Generate Key
Save as: backend/firebaseServiceAccount.json
```

### 2. Install Backend
```bash
cd backend
npm install
```

### 3. Configure Backend
Create `backend/.env`:
```
FIREBASE_DATABASE_URL=https://YOUR-PROJECT.firebaseio.com
PORT=3000
NODE_ENV=development
```

### 4. Start Backend
```bash
npm start
# Should show: API running on http://localhost:3000
```

### 5. Update HTML Files
Add these before `</body>` in each HTML file:
```html
<script src="api-service.js"></script>
<script src="app-firestore.js"></script>
```

## 📋 Key Changes from Old Version

| Feature | Old (localStorage) | New (Firestore) |
|---------|-------------------|-----------------|
| Storage | Browser only | Cloud database |
| Data Access | Single device | Any device |
| Performance | Instant | Network dependent |
| Scalability | Limited | Unlimited |
| Cost | Free | Free tier (generous) |

## 🔧 Updating Forms

### Old Way (sync):
```javascript
AppState.addDefect(defect);
saveData();
```

### New Way (async):
```javascript
await AppState.addDefect(defect);
// automatically saves to Firestore
```

## 🎯 API Endpoints Quick List

```
GET    /api/defects
POST   /api/defects
PUT    /api/defects/{id}
DELETE /api/defects/{id}

GET    /api/change-requests
POST   /api/change-requests
PUT    /api/change-requests/{id}
DELETE /api/change-requests/{id}

GET    /api/intakes
POST   /api/intakes
PUT    /api/intakes/{id}
DELETE /api/intakes/{id}

GET    /api/stories
POST   /api/stories
PUT    /api/stories/{id}
DELETE /api/stories/{id}

GET    /api/epics
POST   /api/epics
PUT    /api/epics/{id}
DELETE /api/epics/{id}

GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/{id}
DELETE /api/tasks/{id}

GET    /api/resolved
POST   /api/resolved

POST   /api/auth/login
POST   /api/auth/register

GET    /api/activities
POST   /api/activities
```

## 🧪 Test the Connection

1. Start backend: `npm start` (in backend folder)
2. Open browser: `http://localhost:3000/api/health`
3. Check console in DevTools for errors

## 📁 Project Structure

```
The PUB Manager/
├── backend/
│   ├── server.js          (Express API)
│   ├── package.json       (Dependencies)
│   ├── .env.example       (Template)
│   └── firebaseServiceAccount.json  (SECRET!)
├── api-service.js         (API client)
├── app-firestore.js       (New app logic)
├── index.html
├── login.html
├── defect-add.html
├── ... (other pages)
└── FIRESTORE_SETUP.md     (Full guide)
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| API not responding | Check `npm start` running in backend |
| CORS errors | Backend must be on same machine |
| Auth errors | Check firebaseServiceAccount.json exists |
| Network errors | Check PORT 3000 not blocked by firewall |

## 📝 Update Login Page Example

```html
<form onsubmit="handleLogin(event)">
  <input id="email" type="email" required>
  <input id="password" type="password" required>
  <button type="submit">Login</button>
</form>

<script>
async function handleLogin(event) {
  event.preventDefault();
  try {
    const user = await api.login(
      document.getElementById('email').value,
      document.getElementById('password').value
    );
    sessionStorage.setItem('loggedInUser', JSON.stringify(user.user));
    window.location.href = 'index.html';
  } catch (error) {
    alert('Login error: ' + error.message);
  }
}
</script>
```

## 🔐 Important Security Notes

1. **Never commit** `firebaseServiceAccount.json`
2. Add to `.gitignore` (already done in project)
3. In production, set up proper Firestore security rules
4. Use HTTPS when deployed
5. Don't log sensitive data to console

## 📞 Common Questions

**Q: Can I switch back to localStorage?**
A: Yes, use the old `app.js` file and revert HTML imports.

**Q: What if I don't have Node.js?**
A: Download from https://nodejs.org/

**Q: Can I use Firebase Hosting instead of Firestore?**
A: Firestore is the database. You can host the frontend on Firebase Hosting separately.

**Q: Is the free tier enough?**
A: Firestore free tier includes:
- 1 GB storage
- 50k reads/day
- 20k writes/day
- This is plenty for development and small teams

**Q: How do I deploy to production?**
A: See "Deployment Options" in FIRESTORE_SETUP.md

---

**Next Steps:**
1. Follow steps 1-5 above
2. Test with browser at localhost:3000/api/health
3. Read FIRESTORE_SETUP.md for detailed instructions
4. Update your HTML forms as shown
5. Deploy when ready!
