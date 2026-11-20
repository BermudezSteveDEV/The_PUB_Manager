# Form Updates Guide - Migrating to Firestore REST API

## Overview
This guide shows you how to update each HTML form to use the new Firestore REST API instead of localStorage.

## General Pattern

### Old Pattern (localStorage - Synchronous)
```javascript
function handleSubmit() {
  const data = { /* form data */ };
  AppState.addItem(data);
  AppState.saveData();  // Manual save
  // UI update happens immediately
}
```

### New Pattern (Firestore API - Asynchronous)
```javascript
async function handleSubmit(event) {
  event.preventDefault();
  try {
    const data = { /* form data */ };
    const result = await api.addItem(data);  // Wait for API response
    // Automatic save to Firestore
    // Show success message
  } catch (error) {
    // Handle error
  }
}
```

---

## Form-by-Form Updates

### 1. LOGIN FORM (login.html)

**OLD CODE:**
```javascript
function login() {
  // No backend, just hardcoded users or localStorage
  const user = { name: 'User', email: 'user@example.com' };
  sessionStorage.setItem('loggedInUser', JSON.stringify(user));
}
```

**NEW CODE:**
```javascript
async function handleLogin(event) {
  event.preventDefault();
  try {
    document.getElementById('loginBtn').disabled = true;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Call Firestore API
    const response = await api.login(email, password);
    
    // Store user in session
    sessionStorage.setItem('loggedInUser', JSON.stringify(response.user));
    
    // Redirect
    window.location.href = 'index.html';
  } catch (error) {
    alert('Login failed: ' + error.message);
    document.getElementById('loginBtn').disabled = false;
  }
}
```

**HTML Changes:**
```html
<!-- OLD -->
<button onclick="login()">Login</button>

<!-- NEW -->
<form onsubmit="handleLogin(event)">
  <input type="email" id="email" required>
  <input type="password" id="password" required>
  <button type="submit" id="loginBtn">Login</button>
</form>
```

---

### 2. DEFECT ADD FORM (defect-add.html)

**OLD CODE:**
```javascript
function submitDefect() {
  const defect = {
    jiraId: document.getElementById('jiraId').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value
  };
  AppState.addDefect(defect);
  AppState.saveData();
  // Modal closes
}
```

**NEW CODE:**
```javascript
async function submitDefect(event) {
  event.preventDefault();
  try {
    document.getElementById('submitBtn').disabled = true;
    
    const defect = {
      jiraId: document.getElementById('jiraId').value,
      description: document.getElementById('description').value,
      priority: document.getElementById('priority').value,
      component: document.getElementById('component').value || null,
      assignee: document.getElementById('assignee').value || null
    };
    
    // Call Firestore API
    const result = await api.addDefect(defect);
    
    // Show success
    alert('Defect added successfully!');
    
    // Reset form
    event.target.reset();
    
    // Close modal
    closeModal('defectModal');
    
    // Refresh list
    AppState.loadData();
    AppState.updateDashboard();
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    document.getElementById('submitBtn').disabled = false;
  }
}
```

**HTML Changes:**
```html
<!-- OLD -->
<form onsubmit="submitDefect(); return false;">

<!-- NEW -->
<form id="defectForm" onsubmit="submitDefect(event)">

<!-- For submit button -->
<button type="submit" id="submitBtn">Add Defect</button>
```

---

### 3. CHANGE REQUEST ADD FORM (cr-add.html)

**OLD CODE:**
```javascript
function submitCR() {
  const cr = {
    jiraId: document.getElementById('crJiraId').value,
    description: document.getElementById('crDescription').value,
    priority: document.getElementById('crPriority').value,
    impactArea: document.getElementById('impactArea').value
  };
  AppState.addChangeRequest(cr);
  AppState.saveData();
}
```

**NEW CODE:**
```javascript
async function submitCR(event) {
  event.preventDefault();
  try {
    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    
    const cr = {
      jiraId: document.getElementById('crJiraId').value,
      description: document.getElementById('crDescription').value,
      priority: document.getElementById('crPriority').value,
      impactArea: document.getElementById('impactArea').value,
      riskLevel: document.getElementById('riskLevel').value || 'Medium'
    };
    
    // Call Firestore API
    await api.addChangeRequest(cr);
    
    alert('Change Request added successfully!');
    event.target.reset();
    closeModal('crModal');
    
    // Reload data
    AppState.loadData();
    AppState.updateDashboard();
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    event.target.querySelector('[type="submit"]').disabled = false;
  }
}
```

---

### 4. INTAKE ADD FORM (intake-add.html)

**OLD CODE:**
```javascript
function submitIntake() {
  const intake = {
    jiraId: document.getElementById('intakeJiraId').value,
    description: document.getElementById('intakeDescription').value,
    requestDate: document.getElementById('requestDate').value
  };
  AppState.addIntake(intake);
  AppState.saveData();
}
```

**NEW CODE:**
```javascript
async function submitIntake(event) {
  event.preventDefault();
  try {
    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    
    const intake = {
      jiraId: document.getElementById('intakeJiraId').value,
      description: document.getElementById('intakeDescription').value,
      requestDate: document.getElementById('requestDate').value,
      submittedBy: document.getElementById('submittedBy').value || null
    };
    
    // Call Firestore API
    await api.addIntake(intake);
    
    alert('Intake submitted successfully!');
    event.target.reset();
    closeModal('intakeModal');
    
    // Reload data
    AppState.loadData();
    AppState.updateDashboard();
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    event.target.querySelector('[type="submit"]').disabled = false;
  }
}
```

---

### 5. STORY ADD FORM (story-add.html)

**OLD CODE:**
```javascript
function submitStory() {
  const story = {
    jiraId: document.getElementById('storyJiraId').value,
    description: document.getElementById('storyDesc').value,
    acceptanceCriteria: document.getElementById('acceptanceCriteria').value,
    estimatedPoints: document.getElementById('points').value
  };
  AppState.addStory(story);
  AppState.saveData();
}
```

**NEW CODE:**
```javascript
async function submitStory(event) {
  event.preventDefault();
  try {
    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    
    const story = {
      jiraId: document.getElementById('storyJiraId').value,
      description: document.getElementById('storyDesc').value,
      acceptanceCriteria: document.getElementById('acceptanceCriteria').value,
      estimatedPoints: document.getElementById('points').value || 0,
      epicId: document.getElementById('epicId').value || null
    };
    
    // Call Firestore API
    await api.addStory(story);
    
    alert('Story added successfully!');
    event.target.reset();
    closeModal('storyModal');
    
    // Reload data
    AppState.loadData();
    AppState.updateDashboard();
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    event.target.querySelector('[type="submit"]').disabled = false;
  }
}
```

---

### 6. EPIC ADD FORM (epic-add.html)

**OLD CODE:**
```javascript
function submitEpic() {
  const epic = {
    jiraId: document.getElementById('epicJiraId').value,
    description: document.getElementById('epicDesc').value,
    targetDate: document.getElementById('targetDate').value
  };
  AppState.addEpic(epic);
  AppState.saveData();
}
```

**NEW CODE:**
```javascript
async function submitEpic(event) {
  event.preventDefault();
  try {
    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    
    const epic = {
      jiraId: document.getElementById('epicJiraId').value,
      description: document.getElementById('epicDesc').value,
      targetDate: document.getElementById('targetDate').value,
      goals: document.getElementById('goals').value || null,
      budget: document.getElementById('budget').value || null
    };
    
    // Call Firestore API
    await api.addEpic(epic);
    
    alert('Epic created successfully!');
    event.target.reset();
    closeModal('epicModal');
    
    // Reload data
    AppState.loadData();
    AppState.updateDashboard();
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    event.target.querySelector('[type="submit"]').disabled = false;
  }
}
```

---

### 7. TASK ADD FORM (task-add.html)

**OLD CODE:**
```javascript
function submitTask() {
  const task = {
    jiraId: document.getElementById('taskJiraId').value,
    description: document.getElementById('taskDesc').value,
    assignedTo: document.getElementById('assignedTo').value,
    dueDate: document.getElementById('dueDate').value
  };
  AppState.addTask(task);
  AppState.saveData();
}
```

**NEW CODE:**
```javascript
async function submitTask(event) {
  event.preventDefault();
  try {
    const submitBtn = event.target.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    
    const task = {
      jiraId: document.getElementById('taskJiraId').value,
      description: document.getElementById('taskDesc').value,
      assignedTo: document.getElementById('assignedTo').value,
      dueDate: document.getElementById('dueDate').value,
      priority: document.getElementById('priority').value || 'Medium'
    };
    
    // Call Firestore API
    await api.addTask(task);
    
    alert('Task added successfully!');
    event.target.reset();
    closeModal('taskModal');
    
    // Reload data
    AppState.loadData();
    AppState.updateDashboard();
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    event.target.querySelector('[type="submit"]').disabled = false;
  }
}
```

---

## Common Patterns

### Pattern 1: Simple Add/Create Operations
```javascript
async function submit(event) {
  event.preventDefault();
  try {
    const data = { /* collected from form */ };
    await api.addItem(data);  // Replace with actual method
    alert('Success!');
    event.target.reset();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

### Pattern 2: Update Operations
```javascript
async function updateItem(itemId) {
  try {
    const updatedData = { /* new values */ };
    await api.updateItem(itemId, updatedData);  // Replace with actual method
    alert('Updated successfully!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

### Pattern 3: Delete Operations
```javascript
async function deleteItem(itemId) {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }
  
  try {
    await api.deleteItem(itemId);  // Replace with actual method
    alert('Deleted successfully!');
    AppState.loadData();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}
```

---

## Checklist for Updating Forms

For each form, ensure:
- [ ] Function is `async`
- [ ] Takes `event` parameter if it's a form submit
- [ ] Calls `event.preventDefault()` if form exists
- [ ] Wrapped in `try/catch` block
- [ ] Uses `await` for API calls
- [ ] Uses `api.` prefix for API calls (not `AppState.`)
- [ ] Shows loading state (disable button)
- [ ] Shows success/error messages
- [ ] Calls `AppState.loadData()` after changes to refresh
- [ ] Calls `AppState.updateDashboard()` to update UI
- [ ] Button has `type="submit"` not `onclick="..."`

---

## Best Practices

1. **Always use async/await** for API calls
2. **Show loading state** while waiting for API (disable button)
3. **Catch errors** with try/catch blocks
4. **Show user feedback** with alert() or toast messages
5. **Reload data** after making changes
6. **Validate inputs** before sending to API
7. **Use descriptive error messages**
8. **Test with network slow in DevTools** to catch UI issues

---

## Debugging Tips

### Check if API is responding:
```javascript
// In browser console
await api.health()
// Should show: { status: 'API is running', timestamp: ... }
```

### Check backend logs:
```bash
# In terminal where backend is running
# You'll see any errors or API calls
```

### Use browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Watch API calls to localhost:3000
4. Check response status and data

### Common Errors:
- `TypeError: api is not defined` → Missing `<script src="api-service.js"></script>`
- `Failed to fetch` → Backend not running
- `CORS error` → Make sure backend is on same machine during development
