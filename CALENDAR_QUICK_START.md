# Calendar Feature - Quick Start Guide

## Getting Started

### Access the Calendar
1. Log in to PUB Manager
2. Click on **📅 Calendar** in the left sidebar
3. You'll see the current month's calendar view

## What You See

### Calendar Display
- **Large Month Grid**: Shows all dates in the current month
- **Color-coded Items**: 
  - Small badges with ticket numbers (e.g., "1234") = Jira tickets due that day
  - 🎉 emoji = Holidays
  - Small event badges = Your custom events

### Header Controls
```
← Previous Month | Month Year | Next Month → | Today Button
```

### Holiday Filter
```
☑ 🇺🇸 US  ☑ 🇬🇧 UK  ☑ 🇮🇳 India
```

## Quick Tasks

### View Details for a Specific Date
1. Click on any date in the calendar
2. A modal opens showing:
   - 🎉 All holidays for that day
   - 📋 All tickets due that day  
   - 📅 All events for that day

### Add a New Event
1. Click on the date where you want to add an event
2. Click the **+ Add Event** button at the bottom of the modal
3. Fill in:
   - **Event Title** (required)
   - **Date** (already selected)
   - **Time** (optional)
   - **Type** (Meeting, Deadline, Reminder, Milestone, Other)
   - **Description** (optional)
4. Click **Save Event**

### Edit an Event
1. Click on the date with the event
2. Find the event in the modal
3. Click the **Edit** button next to it
4. Modify the details
5. Click **Save Event**

### Delete an Event
1. Click on the date with the event
2. Find the event in the modal
3. Click the **Delete** button (red button)
4. Confirm the deletion

### Change Holiday Display
1. At the top right of the calendar, find the holiday checkboxes
2. Check/uncheck countries to show/hide their holidays:
   - 🇺🇸 US holidays
   - 🇬🇧 UK holidays
   - 🇮🇳 Indian holidays

### Navigate Months
- Click **❮ Previous Month** to go back
- Click **❯ Next Month** to go forward
- Click **Today** to jump to current date

## Understanding the Legend

| Item | Meaning | Example |
|------|---------|---------|
| Colored badges (ID number) | Jira ticket due date | `1234` in red = Defect |
| 🎉 | Holiday | Shows country on hover |
| Small colored text | Custom event | Click to edit/delete |

## Common Scenarios

### I want to see all my project deadlines
1. Open the Calendar
2. Look for the colored badge numbers throughout the month
3. Click on a date to see the ticket details
4. The badge color tells you the ticket type

### I need to avoid scheduling during holidays
1. Keep holiday filters ON (default)
2. Look for 🎉 emoji on dates
3. Schedule your custom events on non-holiday dates

### I want to track a project milestone
1. Click on the target date
2. Click **+ Add Event**
3. Title: "Milestone: [Project Name]"
4. Type: **Milestone**
5. Add description and time
6. Save

### I'm traveling and need to see multiple holidays
1. Go to the Calendar
2. Ensure all country checkboxes are checked
3. Scroll through the month to see all holidays

## Tips

💡 **Pro Tips:**
- Events are saved automatically to your browser
- Click anywhere outside the modal to close it
- Use the time field for precise event scheduling
- Color-coded ticket badges help quickly identify issue types
- The calendar remembers your holiday preference settings

⚠️ **Remember:**
- Due dates for Jira tickets are auto-populated - you can't edit them here
- Only custom events can be edited/deleted
- Clear your browser cache if events don't appear
- Mobile view may show fewer details per date

## Keyboard Shortcuts

Coming soon - Keyboard navigation support will be added in future versions

## Need Help?

### Event Not Saving?
- Check if Firestore connection is active
- Try refreshing the page
- Ensure required fields (Title, Date) are filled

### Tickets Not Showing?
- Make sure the tickets have due dates assigned
- The due date format must be YYYY-MM-DD
- Refresh the page to load latest data

### Holiday Filter Not Working?
- Try unchecking and rechecking the country
- Your preference is stored locally - it persists on reload

## What's Next?

Explore these features:
- ✅ Add events for important deadlines
- ✅ View all project tickets in one place
- ✅ Plan around holidays
- ✅ Share your schedule with team
- 🔜 Set event reminders (coming soon)
- 🔜 Export calendar to PDF (coming soon)

---

**Enjoy using the Calendar feature!** 📅✨
