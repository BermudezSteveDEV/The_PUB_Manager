# PUB Manager - Modern Defect & Change Request Tracker

A sleek, modern web-based application for managing project defects and change requests with local data persistence.

## 🚀 Features

### Core Functionality
- **Defect Management**: Create, track, and resolve defects with detailed information
- **Change Request Management**: Manage change requests with comprehensive tracking
- **Local Data Persistence**: All data is stored locally using browser localStorage
- **Resolved Items Archive**: Keep track of all resolved defects and CRs for historical reference
- **User Authentication**: Custom login and registration system with role-based access
- **User Profiles**: Display user information, assigned roles, and manager details

### Modern Design
- **Tech News Ticker**: TLDR's latest newsletter headlines scroll below the weather on the dashboard and ticket detail page. Headlines link to TLDR in a new tab and refresh hourly.
- **Ticker Controls**: Hover or focus to pause, or use Pause/Resume. Reduced-motion preferences disable scrolling and allow manual horizontal scrolling instead. Feed failures show an explicit message and a link to TLDR.
- **Sleek Aesthetic**: Contemporary UI with smooth animations and transitions
- **Professional Typography**: Uses "Syne" for headers and "Plus Jakarta Sans" for body text
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark-Aware Design System**: Comprehensive color variables for easy customization
- **Intuitive Navigation**: Sidebar navigation with activity badges

### User Management
- **Account Creation**: Register with full name, email, and password
- **Role Assignment**: Select from 19 PUB-specific roles during registration
- **Manager Assignment**: Optional manager field for organizational tracking
- **Profile Management**: View and manage user profile from the header

## 📁 File Structure

```
pub-manager/
├── login.html          # Login and registration page
├── index.html          # Main dashboard and application shell
├── defect-add.html     # Add/create new defect form
├── cr-add.html         # Add/create new change request form
├── styles.css          # Master stylesheet with design system
├── app.js              # Core application logic and state management
└── README.md           # This file
```

## 🔐 Authentication & Storage

### User Storage
- User accounts are stored in `localStorage.pub_users`
- Session data is stored in `sessionStorage.loggedInUser`
- All users can access all data (shared across accounts in browser)

### Data Storage
- **Defects**: `localStorage.pub_defects`
- **Change Requests**: `localStorage.pub_changeRequests`
- **Resolved Items**: `localStorage.pub_resolved`
- **Activity Log**: `localStorage.pub_activities`

## 🎯 PUB Roles Available

Users can select from the following roles during registration:

1. CC_PJF_PROJECT_INTEGRATION_SPECIALIST_JOBCOMCAST_CUSTOM
2. CMST_PRJ_REPORTING_CORP_JOB
3. CMST_PRJ_PROJECT_BUSINESS_SETUP_JOB
4. CMST_IT_APPLICATION_ADMINISTRATOR_JOB
5. CMST_IT_SECURITY_MANAGER_JOB
6. CMST_PRJ_ADMINISTRATOR_JOB
7. CMST_PUB_PROJECT_MANAGER_JOB
8. CMST_IT_LOAD_INTERFACE_FILE_FOR_IMPORT_JOB
9. CMST_IT_FINANCIAL_APPLICATION_ADMINISTRATOR_JOB
10. CMST_HUB2U_TECH_USER_JOB
11. CMST_ESS_EMPLOYEE_ABSTRACT
12. CMST_PRJ_PROJECT_RESOURCE_JOB
13. CMST_GM_GRANTS_MANAGER_JOB
14. CMST_PRJ_PROJECT_BILLING_SPECIALIST_JOB
15. CMST_PUB_PROJECT_PARTICIPANT_JOB
16. CMST_GM_REPORTING_JOB
17. CMST_ABILITY_EXT_BILLING_CUSTOM_OBJECT_JOB
18. CMST_PRJ_PROGRAM_MANAGER_JOB
19. CMST_CAPEX_INCORTA_REPORTING_JOB

## 🚀 Getting Started

### Initial Setup
1. Open `login.html` in a web browser
2. Create a new account by clicking "Create one" on the login page
3. Fill in your details:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
   - Confirm Password
   - Manager (optional)
   - Select at least one PUB Role
4. Click "Create Account"
5. Log in with your email and password

### Creating Items

#### Adding a Defect
1. From the dashboard, click "Add Defect" or navigate to the Defects section
2. Fill in required fields:
   - JIRA ID
   - Priority (Critical/High/Medium/Low)
   - Title
   - Assigned To
3. Fill in optional fields as needed
4. Click "Create Defect"

#### Adding a Change Request
1. From the dashboard, click "Add Change Request" or navigate to CR section
2. Fill in required fields:
   - JIRA ID
   - Priority
   - Title
   - Assigned To
3. Fill in optional CR-specific fields
4. Click "Create Change Request"

### Managing Items

#### Links in Ticket Descriptions
- Paste an `https://`, `http://`, or `www.` web address directly into the description.
- Links become clickable inline when viewing a ticket in the dashboard modal or detail page, including resolved tickets.
- Links open in a new tab. Editing retains the original plain text and line breaks; HTML is displayed as text, not executed.

#### View All Items
- Click on "Defects" or "Change Requests" in the sidebar
- Use search and filter options to find specific items

#### Search & Filter
- **By ID**: Enter the system-generated ID
- **By JIRA ID**: Enter the JIRA ticket identifier
- **By Status**: Filter by Open, In Progress, or Resolved

#### Resolving Items
1. Find the item you want to resolve
2. Click the "✅ Resolve" button
3. Confirm the action
4. Item automatically moves to "Resolved Items"

#### Viewing Resolved Items
- Click "Resolved Items" in the sidebar
- View all completed defects and change requests
- Delete resolved items if needed

## 🎨 Design Features

### Typography
- **Display Font**: Syne (headings)
- **Body Font**: Plus Jakarta Sans (content)
- Modern, readable, and professional appearance

### Color Scheme
- **Primary**: #0066ff (Blue)
- **Secondary**: #6b21a8 (Purple)
- **Success**: #10b981 (Green)
- **Danger**: #ef4444 (Red)
- **Neutral**: Slate grays for backgrounds and borders

### Status Badges
- **Open**: Yellow background
- **In Progress**: Blue background
- **Resolved**: Green background

### Priority Badges
- **Critical**: Red background
- **High**: Orange background
- **Medium**: Yellow background
- **Low**: Green background

## 📊 Dashboard Features

### Statistics
- Open defects count
- Open change requests count
- Total resolved items
- High-priority items count

### Quick Actions
- Direct buttons to add new items
- Quick navigation to view all items

### Recent Activity
- Real-time activity log
- Timestamps and user attribution
- Limited to 20 most recent activities

## 🔄 Data Persistence

All data is stored locally in the browser:
- **Automatic Saving**: Data is saved to localStorage after each action
- **Session Persistence**: User login information persists during the session
- **Cross-Tab**: Data is shared across all tabs of the same browser
- **No Backend Required**: Fully client-side application

### Important Notes
- Clearing browser cache will delete all data
- Each browser/device has separate data storage
- Data is not synced across devices

## 🛠️ Customization

### Adding New Roles
Edit the `PUB_ROLES` array in `login.html`:
```javascript
const PUB_ROLES = [
  'ROLE_NAME_HERE',
  // ... add more roles
];
```

### Changing Colors
Edit CSS variables in `styles.css`:
```css
:root {
  --primary: #0066ff;
  --secondary: #6b21a8;
  /* ... more variables */
}
```

### Modifying Fields
Edit form fields in `defect-add.html` and `cr-add.html` to add/remove fields

## 🔒 Security Notes

⚠️ **Important**: This is a client-side demo application. For production use:
- Implement proper server-side authentication
- Use HTTPS for all communications
- Implement proper data encryption
- Add user permission controls
- Use a proper database backend
- Implement data backup and recovery

## 📱 Responsive Breakpoints

- **Desktop**: Full sidebar navigation and multi-column layouts
- **Tablet (768px)**: Optimized spacing and touch-friendly buttons
- **Mobile (600px)**: Stack layout, hamburger-style navigation

## 🐛 Troubleshooting

### Deployed Changes Not Appearing
- The active application is `app-firestore.js`, not the legacy `app.js`.
- Firebase Hosting revalidates HTML, JavaScript, and CSS on each request. The main script and stylesheet also use versioned URLs to bypass older cached assets.
- After deploying, reload the page to run the new code; an already-open page keeps its loaded JavaScript until refreshed.

### Can't Log In
- Ensure you've created an account first
- Check that email and password are correct
- Clear browser cache if issues persist

### Data Not Saving
- Check browser's localStorage is enabled
- Ensure sufficient storage space available
- Try refreshing the page

### Missing Items
- Verify you're logged in with the correct account
- Check filters aren't hiding your items
- Try searching for items directly

## 🚀 Future Enhancements

Potential features for future versions:
- Export/import data (CSV, JSON)
- Advanced reporting and analytics
- Email notifications
- Bulk operations
- Comment/discussion threads
- Attachment support
- Advanced filtering and saved views
- Integration with JIRA API

## 📄 License

This application is provided as-is for project management purposes.

## 📧 Support

For issues or feature requests, please document them with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS information

---

**Version**: 1.0.0  
**Last Updated**: March 2026
