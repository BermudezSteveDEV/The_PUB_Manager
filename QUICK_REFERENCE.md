# PUB Manager - Quick Reference Guide

## 🚀 Getting Started (3 Easy Steps)

### 1. Create Account
- Open `login.html`
- Click "Create one"
- Fill in: Name, Email, Password, (optional Manager), Select Roles
- Click "Create Account"

### 2. Login
- Use your email and password
- Click "Sign In"

### 3. Start Using
- Dashboard shows overview
- Use sidebar to navigate
- Click quick action buttons

---

## 📋 Main Sections

| Section | Icon | Purpose |
|---------|------|---------|
| Dashboard | 📈 | Overview and statistics |
| Defects | 🐛 | Track bugs and issues |
| Change Requests | 📝 | Manage system changes |
| Resolved Items | ✅ | View completed work |

---

## ➕ Creating Items

### Add Defect
```
Click → "➕ Add Defect"
Fill → JIRA ID, Priority, Title, Assignee
Click → "Create Defect"
```

**Key Fields:**
- JIRA ID (required) - ticket number
- Priority (required) - Critical/High/Medium/Low
- Title (required) - issue summary
- Assignee (required) - team member name
- Due Date - deadline
- Component - system area
- Severity - Blocker/Major/Minor
- Environment - Dev/Staging/Prod
- Steps to Reproduce - how to recreate

### Add Change Request
```
Click → "➕ Add CR"
Fill → JIRA ID, Priority, Title, Assignee
Add → Change Type, Impact, Risk Level
Click → "Create Change Request"
```

**Key Fields:**
- JIRA ID (required)
- Priority (required)
- Title (required)
- Assignee (required)
- Change Type - Enhancement/Bug Fix/etc
- Impact Level - Low/Medium/High
- Risk Level - Assessment
- Testing Plan - QA approach
- Rollback Plan - Recovery steps

---

## 🔍 Finding Items

### Search by ID
```
Enter → System-generated ID (ABC12345)
View → Specific item details
```

### Search by JIRA
```
Enter → JIRA ticket (PROJ-1234)
View → Matching items
```

### Filter by Status
```
Select → Open / In Progress / Resolved
View → Filtered list
```

---

## ✅ Resolving Items

### Resolve Any Item
```
Find → Item to resolve
Click → "✅ Resolve" button
Confirm → Action
Result → Moves to "Resolved Items"
```

**When Resolved:**
- Status changes to "Resolved"
- Moved from active to archived
- Resolution date recorded
- Resolved by username recorded

---

## 👤 User Profile

### Access Profile
```
Click → User Avatar (top right)
View → Name, Email, Roles
Option → Edit Profile (coming soon)
Option → View My Roles
Option → Logout
```

### Available Roles
You can select from 19 PUB roles:
- Project managers
- IT administrators
- Project specialists
- Financial specialists
- And more...

---

## 📊 Dashboard Elements

### Statistics Cards
- **Open Defects** - Bugs needing work
- **Open Change Requests** - Pending changes
- **Resolved Items** - Completed work
- **High Priority** - Urgent items (Critical + High)

### Quick Actions
- ➕ Add Defect - Create new bug
- ➕ Add CR - Create new change
- 🔍 View All Defects - See all bugs
- 🔍 View All CRs - See all changes

### Recent Activity
- Shows last 20 actions
- Includes timestamps
- Shows who made changes

---

## 🎨 Status & Priority Badges

### Status
| Status | Color | Meaning |
|--------|-------|---------|
| Open | 🟨 Yellow | Not started |
| In Progress | 🔵 Blue | Currently working |
| Resolved | 🟩 Green | Completed |

### Priority
| Level | Color | Urgency |
|-------|-------|---------|
| Critical | 🔴 Red | Immediate |
| High | 🟠 Orange | Soon |
| Medium | 🟨 Yellow | Normal |
| Low | 🟩 Green | Later |

---

## 💾 Data Storage

### Automatic Saving
- Saves immediately after actions
- No manual save button needed
- Data stored locally in browser

### Where Data Lives
- **Defects** - Browser storage
- **Change Requests** - Browser storage
- **Resolved Items** - Browser storage
- **Activity Log** - Browser storage
- **User Accounts** - Browser storage

### Important
- ⚠️ Clearing cache = data loss
- ⚠️ Not synced across devices
- ✅ Survives browser restart

---

## 🎯 Common Tasks

### Task: Find Critical Issue
```
1. Go to Defects
2. Use Priority filter
3. Select "Critical"
4. View matching items
5. Click to see details
```

### Task: Complete Change Request
```
1. Go to Change Requests
2. Find your item
3. Click "✅ Resolve"
4. Confirm action
5. Check Resolved Items
```

### Task: View Team Assignments
```
1. Go to Defects or CRs
2. Look at "Assigned To" field
3. See who has what work
4. Filter by assignee (coming soon)
```

### Task: Check My Activity
```
1. Dashboard shows Recent Activity
2. See your last 20 actions
3. Check timestamps
4. Verify completions
```

---

## ⌨️ Keyboard Shortcuts (Coming Soon)

| Shortcut | Action |
|----------|--------|
| Esc | Close menus |
| / | Quick search |
| ? | Help |

---

## 🔒 Login Tips

### Create Strong Password
- At least 6 characters
- Mix of letters and numbers
- Recommended: 8+ characters
- Remember for next time

### Account Recovery
- Email is your username
- No password reset (demo version)
- Create new account if forgotten
- Contact support for production version

---

## 📱 Mobile Usage

### Responsive Design
- Works on all screen sizes
- Touch-friendly buttons
- Stacked layout on small screens
- Full functionality preserved

### Mobile Tips
- Landscape mode easier to read
- Tap user avatar for profile
- Swipe to access menus
- Tap outside menu to close

---

## 🆘 Troubleshooting

### Problem: Can't Login
**Solution:** 
- Verify email address
- Check password (case sensitive)
- Create new account if needed

### Problem: Can't Find Items
**Solution:**
- Check filter settings
- Try different search terms
- Verify correct status selected
- Check if item resolved

### Problem: Missing Data
**Solution:**
- Refresh page (may be display issue)
- Check localStorage enabled
- Clear filters
- Restart browser

### Problem: Buttons Not Working
**Solution:**
- Refresh page
- Clear browser cache
- Try different browser
- Check JavaScript enabled

---

## 🎓 Best Practices

### For Defects
✅ Use clear JIRA IDs
✅ Set accurate priority
✅ Assign to responsible person
✅ Include steps to reproduce
✅ Update status regularly
✅ Resolve when complete

### For Change Requests
✅ Detail the change clearly
✅ Assess impact properly
✅ Include rollback plan
✅ Get testing verified
✅ Set realistic dates
✅ Track implementation

### For Everyone
✅ Keep descriptions clear
✅ Use proper priority levels
✅ Assign to real people
✅ Set achievable dates
✅ Resolve completed items
✅ Review activity log

---

## 📞 Getting Help

### In Application
- Hover over fields for tooltips (coming soon)
- Read form labels carefully
- Check error messages
- Use required field indicators (*)

### From README
- Open README.md for full docs
- Check IMPLEMENTATION_GUIDE.md for details
- Review data schema section
- See customization guide

### Common Questions

**Q: Where is my data stored?**
A: In your browser's local storage (localStorage)

**Q: Can I backup my data?**
A: Export from browser dev tools, or use browser built-in backup

**Q: Can multiple people use this?**
A: Yes, each person creates own account, data shared in browser

**Q: Is this secure?**
A: OK for demo/internal use, add security for production

**Q: Can I use this offline?**
A: Yes! It works completely offline

**Q: How much data can I store?**
A: Usually 5-10MB, plenty for most use cases

---

## 🎉 You're Ready!

You now have everything you need to use PUB Manager effectively. Start with the dashboard, create your first item, and explore the interface.

**Have fun managing your work!**

---

### Quick Links
- **Main App**: index.html
- **Login Page**: login.html
- **Full Guide**: README.md
- **Setup Guide**: IMPLEMENTATION_GUIDE.md

**Version**: 1.0  
**Last Updated**: March 2026
