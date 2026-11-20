/* ==========================================
   CALENDAR MANAGEMENT SYSTEM
   Manages calendar view, events, holidays, and Jira tickets
   ========================================== */

const CalendarManager = {
  currentDate: new Date(),
  events: [],
  selectedCountries: ['US', 'UK', 'India'],
  isLoading: false,
  // Sprint 1 starts Wednesday, Oct 21, 2026; sprints repeat every 14 days (Wed–Tue).
  SPRINT_ANCHOR_UTC: Date.UTC(2026, 9, 21),
  SPRINT_LENGTH_DAYS: 14,

  getSprintForDate(year, month, day) {
    const dayMs = 86400000;
    const diffDays = Math.round((Date.UTC(year, month, day) - this.SPRINT_ANCHOR_UTC) / dayMs);
    if (diffDays < 0) return null;

    const index = Math.floor(diffDays / this.SPRINT_LENGTH_DAYS);
    const dayInSprint = diffDays % this.SPRINT_LENGTH_DAYS;
    const startMs = this.SPRINT_ANCHOR_UTC + index * this.SPRINT_LENGTH_DAYS * dayMs;
    const fmt = (ms) => new Date(ms).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

    return {
      number: index + 1,
      dayInSprint,
      isStart: dayInSprint === 0,
      isEnd: dayInSprint === this.SPRINT_LENGTH_DAYS - 1,
      startLabel: fmt(startMs),
      endLabel: fmt(startMs + (this.SPRINT_LENGTH_DAYS - 1) * dayMs)
    };
  },

  // Initialize calendar
  async init() {
    console.log('📅 Initializing Calendar Manager');
    this.renderCalendarHeader();
    this.setupEventListeners();
    await this.loadEvents();
    this.renderCalendar();
    this.loadHolidayPreferences();
  },

  // Setup event listeners
  setupEventListeners() {
    const prevBtn = document.getElementById('calendarPrevMonth');
    const nextBtn = document.getElementById('calendarNextMonth');
    const todayBtn = document.getElementById('calendarToday');
    const countrySelects = document.querySelectorAll('.calendar-country-filter');

    if (prevBtn) prevBtn.addEventListener('click', () => this.previousMonth());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());
    if (todayBtn) todayBtn.addEventListener('click', () => this.goToToday());

    countrySelects.forEach(select => {
      select.addEventListener('change', () => this.updateCountryFilters());
    });
  },

  // Load events from Firestore
  async loadEvents() {
    try {
      if (typeof api === 'undefined' || !api.getCalendarEvents) {
        console.warn('API not available, using localStorage for events');
        const stored = localStorage.getItem('pub_calendar_events');
        this.events = stored ? JSON.parse(stored) : [];
      } else {
        this.events = await api.getCalendarEvents(AppState.currentUser.id);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      const stored = localStorage.getItem('pub_calendar_events');
      this.events = stored ? JSON.parse(stored) : [];
    }
  },

  // Save events to Firestore
  async saveEvents() {
    try {
      localStorage.setItem('pub_calendar_events', JSON.stringify(this.events));
      if (typeof api !== 'undefined' && api.saveCalendarEvents) {
        await api.saveCalendarEvents(AppState.currentUser.id, this.events);
      }
    } catch (error) {
      console.error('Error saving events:', error);
    }
  },

  // Render calendar header with month/year and controls
  renderCalendarHeader() {
    const header = document.getElementById('calendarHeader');
    const monthName = this.currentDate.toLocaleString('default', { month: 'long' });
    const year = this.currentDate.getFullYear();

    header.innerHTML = `
      <div class="calendar-header-content">
        <div class="calendar-nav">
          <button class="calendar-nav-btn" id="calendarPrevMonth" title="Previous month">❮</button>
          <span class="calendar-month-year">${monthName} ${year}</span>
          <button class="calendar-nav-btn" id="calendarNextMonth" title="Next month">❯</button>
          <button class="calendar-today-btn" id="calendarToday">Today</button>
        </div>
        <div class="calendar-filters">
          <label class="filter-label">Show Holidays:</label>
          <div class="filter-checkboxes">
            <label class="checkbox-label">
              <input type="checkbox" class="calendar-country-filter" value="US" checked>
              <span>🇺🇸 US</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="calendar-country-filter" value="UK" checked>
              <span>🇬🇧 UK</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="calendar-country-filter" value="India" checked>
              <span>🇮🇳 India</span>
            </label>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  },

  // Update country filters
  updateCountryFilters() {
    const checkboxes = document.querySelectorAll('.calendar-country-filter');
    this.selectedCountries = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    this.renderCalendar();
  },

  // Load holiday preferences from localStorage
  loadHolidayPreferences() {
    const saved = localStorage.getItem('pub_calendar_holiday_prefs');
    if (saved) {
      this.selectedCountries = JSON.parse(saved);
      const checkboxes = document.querySelectorAll('.calendar-country-filter');
      checkboxes.forEach(cb => {
        cb.checked = this.selectedCountries.includes(cb.value);
      });
    }
  },

  // Save holiday preferences
  saveHolidayPreferences() {
    localStorage.setItem('pub_calendar_holiday_prefs', JSON.stringify(this.selectedCountries));
  },

  // Navigate to previous month
  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
    this.renderCalendarHeader();
  },

  // Navigate to next month
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
    this.renderCalendarHeader();
  },

  // Go to today
  goToToday() {
    this.currentDate = new Date();
    this.renderCalendar();
    this.renderCalendarHeader();
  },

  // Get all Jira tickets with due dates
  getTicketsWithDueDates() {
    const tickets = [];
    const allItems = [
      ...AppState.defects,
      ...AppState.changeRequests,
      ...AppState.intakes,
      ...AppState.stories,
      ...AppState.epics,
      ...AppState.tasks
    ];

    allItems.forEach(item => {
      if (item.dueDate && item.dueDate.trim()) {
        tickets.push({
          id: item.id || item.jiraId,
          jiraId: item.jiraId,
          title: item.title || item.name || item.description || 'Unnamed',
          dueDate: item.dueDate,
          type: this.getItemType(item),
          priority: item.priority || 'Medium',
          status: item.status || 'Open'
        });
      }
    });

    return tickets;
  },

  // Determine item type
  getItemType(item) {
    if (item.hasOwnProperty('severity')) return 'Defect';
    if (item.hasOwnProperty('changeType')) return 'Change Request';
    if (item.hasOwnProperty('epicName')) return 'Story';
    if (item.hasOwnProperty('storyPoints')) return 'Task';
    if (item.hasOwnProperty('epicName')) return 'Epic';
    if (item.hasOwnProperty('intakeName')) return 'Intake';
    return 'Item';
  },

  // Render the calendar
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const calendarGrid = document.getElementById('calendarGrid');
    const daysHeaderContainer = document.getElementById('calendarDaysHeader');

    // Create day headers
    daysHeaderContainer.innerHTML = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = day;
      daysHeaderContainer.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    calendarGrid.innerHTML = '';

    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dayCell = this.createDayCell(day, month - 1, year, true);
      calendarGrid.appendChild(dayCell);
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = this.createDayCell(day, month, year, false);
      calendarGrid.appendChild(dayCell);
    }

    // Add days from next month
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const dayCell = this.createDayCell(day, month + 1, year, true);
      calendarGrid.appendChild(dayCell);
    }
  },

  // Create a single day cell
  createDayCell(day, month, year, isOtherMonth) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';

    if (isOtherMonth) {
      dayCell.classList.add('calendar-other-month');
    }

    // Adjust year for previous/next month
    let adjustedYear = year;
    let adjustedMonth = month;
    if (month < 0) {
      adjustedYear--;
      adjustedMonth = 11;
    } else if (month > 11) {
      adjustedYear++;
      adjustedMonth = 0;
    }

    const dateStr = `${adjustedYear}-${String(adjustedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (isToday) {
      dayCell.classList.add('calendar-today');
    }

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);

    const sprint = this.getSprintForDate(adjustedYear, adjustedMonth, day);
    if (sprint) {
      dayCell.classList.add('calendar-sprint', sprint.number % 2 ? 'calendar-sprint-odd' : 'calendar-sprint-even');
      dayCell.title = `Sprint ${sprint.number}: ${sprint.startLabel} – ${sprint.endLabel}`;
      if (sprint.isStart || sprint.isEnd) {
        const sprintLabel = document.createElement('div');
        sprintLabel.className = 'calendar-sprint-label';
        sprintLabel.textContent = `Sprint ${sprint.number} ${sprint.isStart ? 'Start' : 'End'}`;
        dayCell.appendChild(sprintLabel);
      }
    }

    // Holidays container
    const holidaysContainer = document.createElement('div');
    holidaysContainer.className = 'calendar-holidays-container';
    const holidays = getHolidaysForDate(dateStr, this.selectedCountries);
    holidays.forEach(holiday => {
      const holidayBadge = document.createElement('div');
      holidayBadge.className = 'calendar-holiday-badge';
      holidayBadge.title = `${holiday.name} (${holiday.country})`;
      holidayBadge.textContent = '🎉';
      holidaysContainer.appendChild(holidayBadge);
    });
    if (holidays.length > 0) {
      dayCell.appendChild(holidaysContainer);
    }

    // Events container
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'calendar-events-container';

    // Get tickets with due dates
    const tickets = this.getTicketsWithDueDates().filter(t => t.dueDate === dateStr);
    tickets.forEach(ticket => {
      const ticketBadge = document.createElement('div');
      ticketBadge.className = `calendar-ticket-badge ticket-${ticket.type.toLowerCase()}`;
      ticketBadge.title = `${ticket.jiraId}: ${ticket.title}`;
      ticketBadge.textContent = ticket.jiraId.split('-')[1] || ticket.jiraId;
      ticketBadge.style.cursor = 'pointer';
      ticketBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showTicketDetails(ticket);
      });
      eventsContainer.appendChild(ticketBadge);
    });

    // Get user-created events
    const dayEvents = this.events.filter(e => e.date === dateStr);
    dayEvents.forEach(event => {
      const eventBadge = document.createElement('div');
      eventBadge.className = `calendar-event-badge event-${event.eventType || 'default'}`;
      eventBadge.title = event.title;
      eventBadge.textContent = event.title.substring(0, 3);
      eventBadge.style.cursor = 'pointer';
      eventBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editEvent(event);
      });
      eventsContainer.appendChild(eventBadge);
    });

    if (eventsContainer.children.length > 0) {
      dayCell.appendChild(eventsContainer);
    }

    // Add click event to day cell
    dayCell.addEventListener('click', () => {
      if (!isOtherMonth) {
        this.showDayDetails(dateStr, day, adjustedMonth, adjustedYear);
      }
    });

    return dayCell;
  },

  // Show day details and event management
  showDayDetails(dateStr, day, month, year) {
    const modal = document.getElementById('calendarDayModal');
    const modalContent = document.getElementById('calendarDayModalContent');

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    const dayName = new Date(year, month, day).toLocaleString('default', { weekday: 'long' });

    let html = `
      <div class="calendar-modal-header">
        <h2>${dayName}, ${monthName} ${day}, ${year}</h2>
        <button class="calendar-modal-close" onclick="CalendarManager.closeModal()">×</button>
      </div>

      <div class="calendar-modal-body">
    `;

    const sprint = this.getSprintForDate(year, month, day);
    if (sprint) {
      html += `
        <div class="calendar-modal-section">
          <h3>🏃 Sprint ${sprint.number}</h3>
          <p>${sprint.startLabel} – ${sprint.endLabel} (Day ${sprint.dayInSprint + 1} of ${this.SPRINT_LENGTH_DAYS})</p>
        </div>
      `;
    }

    html += `
        <!-- Holidays Section -->
        <div class="calendar-modal-section">
          <h3>🎉 Holidays</h3>
          <div id="holidaysList">
    `;

    const holidays = getHolidaysForDate(dateStr, this.selectedCountries);
    if (holidays.length > 0) {
      holidays.forEach(holiday => {
        html += `<div class="holiday-item">
          <strong>${holiday.name}</strong> <span class="country-badge">${holiday.country}</span>
        </div>`;
      });
    } else {
      html += '<p class="empty-message">No holidays</p>';
    }

    html += `</div></div>`;

    // Jira Tickets Section
    const tickets = this.getTicketsWithDueDates().filter(t => t.dueDate === dateStr);
    html += `
      <div class="calendar-modal-section">
        <h3>📋 Jira Tickets</h3>
        <div id="ticketsList">
    `;

    if (tickets.length > 0) {
      tickets.forEach(ticket => {
        html += `
          <div class="ticket-item">
            <div class="ticket-header">
              <span class="ticket-id">${ticket.jiraId}</span>
              <span class="ticket-type">${ticket.type}</span>
              <span class="ticket-priority">${ticket.priority}</span>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="ticket-status">${ticket.status}</div>
          </div>
        `;
      });
    } else {
      html += '<p class="empty-message">No tickets due</p>';
    }

    html += `</div></div>`;

    // Events Section
    const dayEvents = this.events.filter(e => e.date === dateStr);
    html += `
      <div class="calendar-modal-section">
        <h3>📅 Events</h3>
        <div id="eventsList">
    `;

    if (dayEvents.length > 0) {
      dayEvents.forEach(event => {
        const eventTime = event.time ? event.time : 'All Day';
        html += `
          <div class="event-item">
            <div class="event-header">
              <strong>${event.title}</strong>
              <div class="event-actions">
                <button class="event-action-btn" onclick="CalendarManager.editEvent(${event.id})">Edit</button>
                <button class="event-action-btn delete" onclick="CalendarManager.deleteEvent(${event.id})">Delete</button>
              </div>
            </div>
            <div class="event-details">
              <span class="event-time">⏰ ${eventTime}</span>
              <span class="event-type">${event.eventType || 'Event'}</span>
            </div>
            <div class="event-description">${event.description || ''}</div>
          </div>
        `;
      });
    } else {
      html += '<p class="empty-message">No events</p>';
    }

    html += `</div></div>`;

    // Add Event Button
    html += `
      <div class="calendar-modal-footer">
        <button class="btn btn-primary" onclick="CalendarManager.showAddEventForm('${dateStr}')">+ Add Event</button>
      </div>
    `;

    modalContent.innerHTML = html;
    modal.style.display = 'block';
  },

  // Show ticket details
  showTicketDetails(ticket) {
    alert(`
📋 Ticket Details
─────────────────
ID: ${ticket.jiraId}
Title: ${ticket.title}
Type: ${ticket.type}
Priority: ${ticket.priority}
Status: ${ticket.status}
Due Date: ${ticket.dueDate}
    `);
  },

  // Show add event form
  showAddEventForm(dateStr = null) {
    const form = document.getElementById('calendarEventForm');
    const modal = document.getElementById('calendarEventModal');

    if (!dateStr) {
      const today = new Date();
      dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    document.getElementById('eventDate').value = dateStr;
    document.getElementById('eventId').value = '';
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDescription').value = '';
    document.getElementById('eventType').value = 'meeting';
    document.getElementById('eventTime').value = '';

    const title = document.getElementById('calendarEventModalTitle');
    title.textContent = 'Add Event';

    modal.style.display = 'block';
  },

  // Edit event
  editEvent(eventOrId) {
    let event;
    if (typeof eventOrId === 'object') {
      event = eventOrId;
    } else {
      event = this.events.find(e => e.id === eventOrId);
    }

    if (!event) return;

    document.getElementById('eventId').value = event.id;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventType').value = event.eventType || 'meeting';
    document.getElementById('eventTime').value = event.time || '';

    const title = document.getElementById('calendarEventModalTitle');
    title.textContent = 'Edit Event';

    const modal = document.getElementById('calendarEventModal');
    modal.style.display = 'block';
  },

  // Save event
  async saveEvent() {
    const eventId = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const description = document.getElementById('eventDescription').value.trim();
    const eventType = document.getElementById('eventType').value;
    const time = document.getElementById('eventTime').value;

    if (!title) {
      alert('Please enter event title');
      return;
    }

    if (!date) {
      alert('Please select a date');
      return;
    }

    if (eventId) {
      // Update existing event
      const event = this.events.find(e => e.id === parseInt(eventId));
      if (event) {
        event.title = title;
        event.date = date;
        event.description = description;
        event.eventType = eventType;
        event.time = time;
      }
    } else {
      // Create new event
      const newEvent = {
        id: Date.now(),
        title,
        date,
        description,
        eventType,
        time,
        createdAt: new Date().toISOString(),
        userId: AppState.currentUser?.id
      };
      this.events.push(newEvent);
    }

    // Save to localStorage and Firestore
    localStorage.setItem('pub_calendar_events', JSON.stringify(this.events));
    
    // Sync to Firestore if API available
    if (typeof api !== 'undefined' && api.saveCalendarEvents && AppState.currentUser?.id) {
      try {
        await api.saveCalendarEvents(AppState.currentUser.id, this.events);
        console.log('Events saved to Firestore');
      } catch (error) {
        console.error('Error syncing events to Firestore:', error);
      }
    }
    
    this.closeModal();
    this.renderCalendar();
    this.closeEventModal();
  },

  // Delete event
  async deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    this.events = this.events.filter(e => e.id !== eventId);
    
    // Save to localStorage and Firestore
    localStorage.setItem('pub_calendar_events', JSON.stringify(this.events));
    
    // Sync to Firestore if API available
    if (typeof api !== 'undefined' && api.saveCalendarEvents && AppState.currentUser?.id) {
      try {
        await api.saveCalendarEvents(AppState.currentUser.id, this.events);
        console.log('Events saved to Firestore after deletion');
      } catch (error) {
        console.error('Error syncing events to Firestore:', error);
      }
    }
    
    this.closeModal();
    this.renderCalendar();
  },

  // Close modal
  closeModal() {
    const modal = document.getElementById('calendarDayModal');
    modal.style.display = 'none';
  },

  // Close event modal
  closeEventModal() {
    const modal = document.getElementById('calendarEventModal');
    modal.style.display = 'none';
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendarGrid')) {
      CalendarManager.init();
    }
  });
} else {
  if (document.getElementById('calendarGrid')) {
    CalendarManager.init();
  }
}
