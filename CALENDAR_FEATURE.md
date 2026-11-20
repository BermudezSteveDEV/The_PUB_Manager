# Calendar Feature Documentation

## Overview
The Calendar feature provides a comprehensive monthly calendar view with integrated functionality for managing Jira ticket due dates, displaying holidays from US, UK, and India, and creating custom events.

## Features

### 1. Monthly Calendar View
- Full month calendar grid with day-by-day view
- Navigate between months using previous/next buttons
- "Today" button to quickly return to current date
- Visual distinction for the current day (highlighted in blue)
- Responsive design that works on mobile and desktop

### 2. Jira Ticket Integration
- **Automatic Display**: All Jira tickets with due dates from the following types are automatically displayed:
  - Defects
  - Change Requests
  - Intakes
  - Stories
  - Epics
  - Tasks
- **Visual Indicators**: Each ticket appears as a small badge showing the ticket number (e.g., "1234" for PROJ-1234)
- **Color Coding**: Different colors for different ticket types:
  - 🔴 Defect (Red)
  - 🟠 Change Request (Orange)
  - 🔵 Story (Blue)
  - 🟢 Task (Green)
  - 🟣 Epic (Purple)
  - 🟣 Intake (Purple)
- **Click to View**: Click any ticket badge to see full details including:
  - Ticket ID and Type
  - Title
  - Priority Level
  - Current Status

### 3. Holiday Display
- **Three Regions**: Toggle display of holidays from:
  - 🇺🇸 United States
  - 🇬🇧 United Kingdom
  - 🇮🇳 India
- **Years Supported**: 2024, 2025, 2026 (easily expandable)
- **Holiday Indicators**: Shows 🎉 emoji on dates with holidays
- **Selectable**: Use checkboxes to filter which countries' holidays to display
- **Hover for Details**: Hover over holiday indicators to see the holiday name and country

### 4. Custom Events Management

#### Add Event
1. Click on any date in the calendar
2. Click the "+ Add Event" button in the day details modal
3. Fill in the event details:
   - **Event Title** (required): Name of the event
   - **Date** (required): Event date
   - **Time** (optional): Event time
   - **Event Type**: Choose from:
     - Meeting
     - Deadline
     - Reminder
     - Milestone
     - Other
   - **Description** (optional): Additional details

#### View Event
1. Click on any date to see all events for that day
2. Events appear in the "Events" section of the day details modal
3. Each event shows:
   - Title
   - Time (if set)
   - Event Type
   - Description
   - Edit and Delete buttons

#### Edit Event
1. Click on a date that contains the event
2. Find the event in the day details modal
3. Click the "Edit" button
4. Modify the event details
5. Click "Save Event"

#### Delete Event
1. Click on a date that contains the event
2. Find the event in the day details modal
3. Click the "Delete" button
4. Confirm the deletion

### 5. Day Details View
Clicking on any calendar date opens a modal showing:
- **Date and Day Name**: Full date information
- **Holidays**: All holidays for that day by region
- **Jira Tickets**: All tickets with due dates
- **Custom Events**: All user-created events with edit/delete options
- **Add Event Button**: Quickly add a new event for that date

## Navigation

### Sidebar Navigation
- Click on the **Calendar** icon (📅) in the left sidebar to access the calendar
- The calendar will display the current month

### Controls
- **Previous Month (❮)**: Navigate to the previous month
- **Next Month (❯)**: Navigate to the next month
- **Today**: Jump to today's date
- **Holiday Filters**: Toggle display of holidays by country

## Data Storage

### Local Storage
- Events are automatically saved to browser's local storage
- Key: `pub_calendar_events`
- Holiday preferences saved in: `pub_calendar_holiday_prefs`

### Firebase Integration
- When connected to Firestore, events are also synchronized to the cloud
- Enables multi-device access and backup
- New events created are automatically synced to `calendarEvents` collection

## Legend

| Symbol | Meaning |
|--------|---------|
| `ID` (colored badge) | Jira ticket due on that date |
| 🎉 | Holiday (hover for details) |
| `Evt` (small badge) | User-created event |

## Tips & Tricks

1. **Filter Holidays**: Uncheck holiday countries if you want a cleaner view
2. **Event Types**: Use different event types for better organization
3. **Color Coding**: Each ticket type has a distinct color for quick identification
4. **Time Zones**: Times are stored in local browser timezone
5. **Mobile View**: Calendar adapts to smaller screens with scrollable layout

## Troubleshooting

### Events not appearing
- Check browser's local storage is enabled
- Clear browser cache and reload
- Ensure Firestore is properly configured (if using cloud sync)

### Holidays not showing
- Verify holiday checkbox is selected for desired country
- Check that year is within supported range (2024-2026)
- Try toggling the country filter off and back on

### Ticket due dates not showing
- Ensure tickets have a `dueDate` field populated in format: YYYY-MM-DD
- Verify all data types (Defects, Stories, Tasks, etc.) are properly saved in the system
- Reload the page to refresh the calendar data

## Future Enhancements

Potential features for future versions:
- Multi-year holiday support (beyond 2026)
- Custom holiday definitions
- Event reminders and notifications
- Calendar sharing with team members
- Integration with other calendar systems (Google Calendar, Outlook)
- Week view and agenda view options
- Recurring events
- Event categories and tagging

## Technical Details

### Files Created
1. **calendar.js**: Main calendar logic and event management
2. **holidays.js**: Holiday data for US, UK, and India
3. **calendar-section.html**: HTML structure (embedded in index.html)
4. **Calendar CSS**: Styles in styles.css under "CALENDAR STYLES" section

### API Functions
Added to `api-service.js`:
- `getCalendarEvents(userId)`: Fetch user's events from Firestore
- `addCalendarEvent(userId, event)`: Create new event
- `updateCalendarEvent(userId, eventId, event)`: Update existing event
- `deleteCalendarEvent(eventId)`: Delete an event
- `saveCalendarEvents(userId, events)`: Batch save events

### Collection Structure (Firestore)
```
calendarEvents/
├── {documentId}
    ├── id: number (timestamp)
    ├── title: string
    ├── date: string (YYYY-MM-DD)
    ├── time: string (HH:MM) or empty
    ├── description: string
    ├── eventType: string (meeting|deadline|reminder|milestone|other)
    ├── userId: string
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

## Support
For issues or feature requests, please contact the development team or submit a support ticket.
