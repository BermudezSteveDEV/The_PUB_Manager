/* ==========================================
   PUB MANAGER - CORE APPLICATION LOGIC (FIRESTORE VERSION)
   Now using REST API with Firestore backend
   ========================================== */

const PUB_ROLES = [
  'CC_PJF_PROJECT_INTEGRATION_SPECIALIST_JOBCOMCAST_CUSTOM',
  'CMST_PRJ_REPORTING_CORP_JOB',
  'CMST_PRJ_PROJECT_BUSINESS_SETUP_JOB',
  'CMST_IT_APPLICATION_ADMINISTRATOR_JOB',
  'CMST_IT_SECURITY_MANAGER_JOB',
  'CMST_PRJ_ADMINISTRATOR_JOB',
  'CMST_PUB_PROJECT_MANAGER_JOB',
  'CMST_IT_LOAD_INTERFACE_FILE_FOR_IMPORT_JOB',
  'CMST_IT_FINANCIAL_APPLICATION_ADMINISTRATOR_JOB',
  'CMST_HUB2U_TECH_USER_JOB',
  'CMST_ESS_EMPLOYEE_ABSTRACT',
  'CMST_PRJ_PROJECT_RESOURCE_JOB',
  'CMST_GM_GRANTS_MANAGER_JOB',
  'CMST_PRJ_PROJECT_BILLING_SPECIALIST_JOB',
  'CMST_PUB_PROJECT_PARTICIPANT_JOB',
  'CMST_GM_REPORTING_JOB',
  'CMST_ABILITY_EXT_BILLING_CUSTOM_OBJECT_JOB',
  'CMST_PRJ_PROGRAM_MANAGER_JOB',
  'CMST_CAPEX_INCORTA_REPORTING_JOB'
];

// Application State
const AppState = {
  currentUser: null,
  defects: [],
  changeRequests: [],
  resolvedItems: [],
  intakes: [],
  stories: [],
  epics: [],
  tasks: [],
  isLoading: false,
  userId: null,
  
  async init() {
    await this.loadUser();
    if (!this.currentUser) {
      return;
    }
    await this.loadData();
    this.updateDashboard();
  },

  async loadUser() {
    const userJson = sessionStorage.getItem('loggedInUser');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
      this.currentUser.roles = this.normalizeRoles(this.currentUser.roles);
      this.userId = this.currentUser.id;
      // Load fresh user data from Firestore
      await this.loadUserFromFirestore();
    } else {
      try {
        const restoredUser = await api.getCurrentUserSession();
        if (!restoredUser) {
          window.location.href = 'login.html';
          return;
        }

        this.currentUser = {
          ...restoredUser,
          roles: this.normalizeRoles(restoredUser.roles)
        };
        this.userId = restoredUser.id;
        sessionStorage.setItem('loggedInUser', JSON.stringify(this.currentUser));
      } catch (error) {
        console.error('Error restoring signed-in user:', error);
        window.location.href = 'login.html';
      }
    }
  },

  normalizeRoles(roles) {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string') {
      return roles.split(',').map(role => role.trim()).filter(Boolean);
    }
    return [];
  },

  async loadUserFromFirestore() {
    try {
      if (this.userId) {
        const userData = await api.getUser(this.userId);
        // Update current user with fresh data from Firestore
        this.currentUser = {
          ...this.currentUser,
          name: userData.name,
          email: userData.email,
          manager: userData.manager,
          roles: this.normalizeRoles(userData.roles),
          department: userData.department || 'N/A',
          rtoTracking: userData.rtoTracking || {}
        };
        // Update sessionStorage with fresh data
        sessionStorage.setItem('loggedInUser', JSON.stringify(this.currentUser));
        // Update UI
        UIManager.updateUserProfile();
        loadProfileDisplay();
        loadRolesDisplay();
      }
    } catch (error) {
      console.error('Error loading user from Firestore:', error);
    }
  },

  async loadData() {
    this.isLoading = true;
    try {
      // Load defects from Firestore
      this.defects = (await api.getDefects()).filter(d => d.status !== 'Resolved');
      
      // Load change requests from Firestore
      this.changeRequests = (await api.getChangeRequests()).filter(c => c.status !== 'Resolved');
      
      // Load resolved items from Firestore
      this.resolvedItems = await api.getResolved();
      
      // Load intakes from Firestore
      this.intakes = (await api.getIntakes()).filter(i => i.status !== 'Resolved');
      
      // Load stories from Firestore
      this.stories = (await api.getStories()).filter(s => s.status !== 'Resolved');
      
      // Load epics from Firestore
      this.epics = (await api.getEpics()).filter(e => e.status !== 'Resolved');
      
      // Load tasks from Firestore
      this.tasks = (await api.getTasks()).filter(t => t.status !== 'Resolved');
      
      console.log('✓ Data loaded from Firestore');
      console.log('Firestore load diagnostics:', {
        defects: this.defects.length,
        defectsResolvedStillPresent: this.defects.filter(d => d.status === 'Resolved').map(d => d.id),
        changeRequests: this.changeRequests.length,
        crResolvedStillPresent: this.changeRequests.filter(c => c.status === 'Resolved').map(c => c.id),
        intakes: this.intakes.length,
        intakesResolvedStillPresent: this.intakes.filter(i => i.status === 'Resolved').map(i => i.id),
        stories: this.stories.length,
        storiesResolvedStillPresent: this.stories.filter(s => s.status === 'Resolved').map(s => s.id),
        epics: this.epics.length,
        epicsResolvedStillPresent: this.epics.filter(e => e.status === 'Resolved').map(e => e.id),
        tasks: this.tasks.length,
        tasksResolvedStillPresent: this.tasks.filter(t => t.status === 'Resolved').map(t => t.id),
        resolvedItems: this.resolvedItems.length,
        resolvedIds: this.resolvedItems.map(item => item.id)
      });
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please refresh the page.');
    } finally {
      this.isLoading = false;
    }
  },

  async updateTicket(type, ticket) {
    const handlers = {
      defect: ['defects', 'updateDefect', 'resolveDefect'],
      cr: ['changeRequests', 'updateChangeRequest', 'resolveCR'],
      intake: ['intakes', 'updateIntake', 'resolveIntake'],
      story: ['stories', 'updateStory', 'resolveStory'],
      epic: ['epics', 'updateEpic', 'resolveEpic'],
      task: ['tasks', 'updateTask', 'resolveTask']
    };
    const handler = handlers[type];
    if (!handler) throw new Error('Unsupported ticket type');
    const [stateKey, updateMethod, resolveMethod] = handler;
    const savedTicket = await api[updateMethod](ticket.id, ticket);
    this[stateKey] = api.uniqueTickets([
      ...this[stateKey].filter(existing => existing.id !== ticket.id),
      savedTicket
    ]);
    if (savedTicket.status === 'Resolved') await this[resolveMethod](savedTicket.id);
    return savedTicket;
  },

  async addDefect(defect) {
    try {
      defect.createdBy = this.currentUser.name;
      defect.priority = defect.priority || 'Medium';
      const newDefect = await api.addDefect(defect);
      this.defects.push(newDefect);
      await this.logActivity(`Added defect ${defect.jiraId}`, '🐛');
      this.updateDashboard();
      return newDefect;
    } catch (error) {
      console.error('Error adding defect:', error);
      throw error;
    }
  },

  async addChangeRequest(cr) {
    try {
      cr.createdBy = this.currentUser.name;
      cr.priority = cr.priority || 'Medium';
      const newCR = await api.addChangeRequest(cr);
      this.changeRequests.push(newCR);
      await this.logActivity(`Added change request ${cr.jiraId}`, '📝');
      this.updateDashboard();
      return newCR;
    } catch (error) {
      console.error('Error adding change request:', error);
      throw error;
    }
  },

  async resolveDefect(defectId) {
    try {
      const defect = this.defects.find(d => d.id === defectId);
      if (defect) {
        defect.status = 'Resolved';
        defect.resolvedDate = new Date().toISOString().split('T')[0];
        defect.resolvedBy = this.currentUser.name;
        
        const resolvedDefect = await api.addResolved({ ...defect, type: 'defect' });
        
        this.defects = this.defects.filter(d => d.id !== defectId);
        this.resolvedItems.push(resolvedDefect);
        
        await this.logActivity(`Resolved defect ${defect.jiraId}`, '✅');
        this.updateDashboard();
      }
    } catch (error) {
      console.error('Error resolving defect:', error);
      throw error;
    }
  },

  async resolveCR(crId) {
    try {
      const cr = this.changeRequests.find(c => c.id === crId);
      if (cr) {
        cr.status = 'Resolved';
        cr.resolvedDate = new Date().toISOString().split('T')[0];
        cr.resolvedBy = this.currentUser.name;
        
        const resolvedCR = await api.addResolved({ ...cr, type: 'cr' });
        
        this.changeRequests = this.changeRequests.filter(c => c.id !== crId);
        
        this.resolvedItems.push(resolvedCR);
        await this.logActivity(`Resolved change request ${cr.jiraId}`, '✅');
        this.updateDashboard();
      }
    } catch (error) {
      console.error('Error resolving change request:', error);
      throw error;
    }
  },

  async restoreResolvedItem(resolvedId) {
    const resolvedItem = this.resolvedItems.find(item => (item.resolvedId || item.id) === resolvedId);
    if (!resolvedItem || !['defect', 'cr'].includes(resolvedItem.type)) {
      throw new Error('Only resolved Defects and Change Requests can be restored');
    }

    const { id, resolvedId: storedResolvedId, type } = resolvedItem;
    const activeTicket = await api.restoreResolvedItem(storedResolvedId || id);
    this.resolvedItems = this.resolvedItems.filter(item => (item.resolvedId || item.id) !== resolvedId);

    if (type === 'defect') {
      this.defects.push(activeTicket);
    } else {
      this.changeRequests.push(activeTicket);
    }

    await this.logActivity(`Restored ${type === 'defect' ? 'defect' : 'change request'} ${activeTicket.jiraId}`, '↩️');
    this.updateDashboard();
    return activeTicket;
  },

  async resolveIntake(intakeId) {
    try {
      const intake = this.intakes.find(i => i.id === intakeId);
      if (intake) {
        intake.status = 'Resolved';
        intake.resolvedDate = new Date().toISOString().split('T')[0];
        intake.resolvedBy = this.currentUser.name;
        
        const resolvedIntake = await api.addResolved({ ...intake, type: 'intake' });
        
        this.intakes = this.intakes.filter(i => i.id !== intakeId);
        this.resolvedItems.push(resolvedIntake);
        
        await this.logActivity(`Resolved intake ${intake.jiraId}`, '✅');
        this.updateDashboard();
      }
    } catch (error) {
      console.error('Error resolving intake:', error);
      throw error;
    }
  },

  async resolveStory(storyId) {
    try {
      const story = this.stories.find(s => s.id === storyId);
      if (story) {
        story.status = 'Resolved';
        story.resolvedDate = new Date().toISOString().split('T')[0];
        story.resolvedBy = this.currentUser.name;
        
        const resolvedStory = await api.addResolved({ ...story, type: 'story' });
        
        this.stories = this.stories.filter(s => s.id !== storyId);
        this.resolvedItems.push(resolvedStory);
        
        await this.logActivity(`Resolved story ${story.jiraId}`, '✅');
        this.updateDashboard();
      }
    } catch (error) {
      console.error('Error resolving story:', error);
      throw error;
    }
  },

  async resolveEpic(epicId) {
    try {
      const epic = this.epics.find(e => e.id === epicId);
      if (epic) {
        epic.status = 'Resolved';
        epic.resolvedDate = new Date().toISOString().split('T')[0];
        epic.resolvedBy = this.currentUser.name;
        
        const resolvedEpic = await api.addResolved({ ...epic, type: 'epic' });
        
        this.epics = this.epics.filter(e => e.id !== epicId);
        this.resolvedItems.push(resolvedEpic);
        
        await this.logActivity(`Resolved epic ${epic.jiraId}`, '✅');
        this.updateDashboard();
      }
    } catch (error) {
      console.error('Error resolving epic:', error);
      throw error;
    }
  },

  async resolveTask(taskId) {
    try {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'Resolved';
        task.resolvedDate = new Date().toISOString().split('T')[0];
        task.resolvedBy = this.currentUser.name;
        
        const resolvedTask = await api.addResolved({ ...task, type: 'task' });
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.resolvedItems.push(resolvedTask);
        
        await this.logActivity(`Resolved task ${task.jiraId}`, '✅');
        this.updateDashboard();
      }
    } catch (error) {
      console.error('Error resolving task:', error);
      throw error;
    }
  },

  async deleteDefect(defectId) {
    try {
      await api.deleteDefect(defectId);
      this.defects = this.defects.filter(d => d.id !== defectId);
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting defect:', error);
      throw error;
    }
  },

  async deleteCR(crId) {
    try {
      await api.deleteChangeRequest(crId);
      this.changeRequests = this.changeRequests.filter(c => c.id !== crId);
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting change request:', error);
      throw error;
    }
  },

  async addIntake(intake) {
    try {
      intake.createdBy = this.currentUser.name;
      const newIntake = await api.addIntake(intake);
      this.intakes.push(newIntake);
      await this.logActivity(`Added intake ${intake.jiraId}`, '📥');
      this.updateDashboard();
      return newIntake;
    } catch (error) {
      console.error('Error adding intake:', error);
      throw error;
    }
  },

  async addStory(story) {
    try {
      story.createdBy = this.currentUser.name;
      const newStory = await api.addStory(story);
      this.stories.push(newStory);
      await this.logActivity(`Added story ${story.jiraId}`, '📖');
      this.updateDashboard();
      return newStory;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  },

  async addEpic(epic) {
    try {
      epic.createdBy = this.currentUser.name;
      const newEpic = await api.addEpic(epic);
      this.epics.push(newEpic);
      await this.logActivity(`Added epic ${epic.jiraId}`, '🎯');
      this.updateDashboard();
      return newEpic;
    } catch (error) {
      console.error('Error adding epic:', error);
      throw error;
    }
  },

  async addTask(task) {
    try {
      task.createdBy = this.currentUser.name;
      const newTask = await api.addTask(task);
      this.tasks.push(newTask);
      await this.logActivity(`Added task ${task.jiraId}`, '✓');
      this.updateDashboard();
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  async deleteIntake(intakeId) {
    try {
      await api.deleteIntake(intakeId);
      this.intakes = this.intakes.filter(i => i.id !== intakeId);
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting intake:', error);
      throw error;
    }
  },

  async deleteStory(storyId) {
    try {
      await api.deleteStory(storyId);
      this.stories = this.stories.filter(s => s.id !== storyId);
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  },

  async deleteEpic(epicId) {
    try {
      await api.deleteEpic(epicId);
      this.epics = this.epics.filter(e => e.id !== epicId);
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting epic:', error);
      throw error;
    }
  },

  async deleteTask(taskId) {
    try {
      await api.deleteTask(taskId);
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  async moveCRToIntake(crId) {
    try {
      const cr = this.changeRequests.find(c => c.id === crId);
      if (!cr) {
        throw new Error('Change Request not found');
      }

      const newIntake = await api.moveCRToIntake(crId);
      this.intakes.push(newIntake);

      this.changeRequests = this.changeRequests.filter(c => c.id !== crId);

      await this.logActivity(`Moved change request ${cr.jiraId} to Intake`, '📥');
      this.updateDashboard();
    } catch (error) {
      console.error('Error moving CR to Intake:', error);
      throw error;
    }
  },

  async moveIntakeToCR(intakeId) {
    try {
      const intake = this.intakes.find(i => i.id === intakeId);
      if (!intake) {
        throw new Error('Intake not found');
      }

      const newCR = await api.moveIntakeToCR(intakeId);
      this.changeRequests.push(newCR);

      this.intakes = this.intakes.filter(i => i.id !== intakeId);

      await this.logActivity(`Moved intake ${intake.jiraId} to Change Request`, '📝');
      this.updateDashboard();
    } catch (error) {
      console.error('Error moving Intake to CR:', error);
      throw error;
    }
  },

  generateId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  },

  async logActivity(message, icon) {
    try {
      await api.logActivity(message, icon, this.currentUser.name);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },

  async loadRecentItems() {
    try {
      const items = await api.getRecentItems(10);
      this.displayRecentActivity(items);
    } catch (error) {
      console.error('Error loading recent items:', error);
      const activityList = document.getElementById('activityList');
      if (activityList) {
        activityList.innerHTML = '<p class="empty-state">Error loading recent activity</p>';
      }
    }
  },

  startRecentActivityAutoRefresh() {
    // Refresh recent activity every 30 seconds
    setInterval(() => {
      this.loadRecentItems();
    }, 30000);
  },

  displayRecentActivity(items) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    if (!items || items.length === 0) {
      activityList.innerHTML = '<p class="empty-state">No recent activity yet</p>';
      return;
    }

    const typeMap = {
      'Defect': 'defect',
      'Change Request': 'cr',
      'Intake': 'intake',
      'Story': 'story',
      'Epic': 'epic',
      'Task': 'task'
    };

    const html = items.map(item => {
      const createdDate = item.sortDate ? new Date(item.sortDate) : new Date();
      const formattedDate = this.formatActivityTime(createdDate);
      const title = item.title || item.jiraId || item.id || 'Untitled';
      const itemId = item.jiraId || item.id;
      const viewType = typeMap[item.itemType] || 'defect';
      
      // Get creator name from various fallback options
      const creatorName = item.createdBy || item.updatedBy || AppState.currentUser?.name || 'System';

      return `
        <div class="activity-item" onclick="viewItem('${viewType}', '${item.id}')">
          <div class="activity-icon">${item.itemIcon}</div>
          <div class="activity-content">
            <div class="activity-header">
              <div class="activity-title">
                <span class="activity-type-badge">${item.itemType}</span>
                ${title}
              </div>
              <span class="activity-time">${formattedDate}</span>
            </div>
            <div class="activity-meta">
              <div class="activity-meta-item">
                <span class="activity-meta-label">ID:</span>
                <span>${itemId}</span>
              </div>
              <div class="activity-meta-item">
                <span class="activity-meta-label">Status:</span>
                <span>${item.status || 'N/A'}</span>
              </div>
              <div class="activity-meta-item">
                <span class="activity-meta-label">By:</span>
                <span>${creatorName}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    activityList.innerHTML = html;
  },

  formatActivityTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  },

  updateDashboard() {
    const stateKeys = ['defects', 'changeRequests', 'intakes', 'stories', 'epics', 'tasks', 'resolvedItems'];
    const tickets = api.uniqueTickets(stateKeys.flatMap(stateKey => this[stateKey].map(ticket => ({ ...ticket, stateKey }))));
    for (const stateKey of stateKeys) {
      this[stateKey] = tickets.filter(ticket => ticket.stateKey === stateKey).map(({ stateKey: group, ...ticket }) => ticket);
    }
    if (!document.getElementById('openDefectsCount')) return;
    document.getElementById('openDefectsCount').textContent = this.defects.length;
    document.getElementById('openCRCount').textContent = this.changeRequests.length;
    document.getElementById('resolvedCount').textContent = this.resolvedItems.length;
    
    const highPriority = [
      ...this.defects.filter(d => d.priority === 'Critical' || d.priority === 'High'),
      ...this.changeRequests.filter(c => c.priority === 'Critical' || c.priority === 'High'),
      ...this.intakes.filter(i => i.priority === 'Critical' || i.priority === 'High'),
      ...this.stories.filter(s => s.priority === 'Critical' || s.priority === 'High'),
      ...this.epics.filter(e => e.priority === 'Critical' || e.priority === 'High'),
      ...this.tasks.filter(t => t.priority === 'Critical' || t.priority === 'High')
    ].length;
    
    document.getElementById('highPriorityCount').textContent = highPriority;
    document.getElementById('defectBadge').textContent = this.defects.length;
    document.getElementById('crBadge').textContent = this.changeRequests.length;
    document.getElementById('resolvedBadge').textContent = this.resolvedItems.length;
    document.getElementById('intakeBadge').textContent = this.intakes.length;
    document.getElementById('storyBadge').textContent = this.stories.length;
    document.getElementById('epicBadge').textContent = this.epics.length;
    document.getElementById('taskBadge').textContent = this.tasks.length;

    if (typeof RTOTracker !== 'undefined') {
      RTOTracker.updateDashboardCard();
    }
    
    // Load and display recent activity
    this.loadRecentItems();
  }
};

const RTOTracker = {
  storageKey: 'pub_rto_daily_records',
  legacyStorageKey: 'pub_rto_monthly_days',
  targetDaysPerWeek: 3.1,
  records: {},
  monthlyFallbackCounts: {},
  selectedMonthKey: null,
  selectedDateKey: null,
  officeOptions: ['Center City', 'West Chester', 'Newark', 'Bishops Gate', 'Remote - Office Visit', 'Other'],

  async init() {
    await this.loadRecords();
    this.setDefaultMonth();
    this.setupEventListeners();
    this.renderMonthCalendar();
    this.updateModalDetails();
    this.updateDashboardCard();
  },

  setupEventListeners() {
    const monthPicker = document.getElementById('rtoMonthPicker');
    const saveDayBtn = document.getElementById('rtoSaveDayBtn');
    const deleteDayBtn = document.getElementById('rtoDeleteDayBtn');
    const exportCsvBtn = document.getElementById('rtoExportCsvBtn');
    const trackedDaysList = document.getElementById('rtoTrackedDaysList');

    monthPicker?.addEventListener('change', () => {
      this.selectedMonthKey = this.getSelectedMonthKey();
      this.selectedDateKey = null;
      this.renderMonthCalendar();
      this.updateModalDetails();
    });

    saveDayBtn?.addEventListener('click', () => this.saveSelectedDay());
    deleteDayBtn?.addEventListener('click', () => this.deleteSelectedDay());
    exportCsvBtn?.addEventListener('click', () => this.downloadMonthlyCSV());

    trackedDaysList?.addEventListener('click', (event) => {
      const target = event.target;
      const editBtn = target.closest('.rto-entry-edit-btn');
      const deleteBtn = target.closest('.rto-entry-delete-btn');

      if (editBtn?.dataset.date) {
        this.selectDate(editBtn.dataset.date);
      }

      if (deleteBtn?.dataset.date) {
        this.deleteDayByDate(deleteBtn.dataset.date);
      }
    });
  },

  async loadRecords() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      const localRecords = saved ? JSON.parse(saved) : {};

      const savedFallback = localStorage.getItem(this.legacyStorageKey);
      this.monthlyFallbackCounts = savedFallback ? JSON.parse(savedFallback) : {};

      const userId = AppState.currentUser?.id;
      const profileRecords = AppState.currentUser?.rtoTracking?.months || AppState.currentUser?.rtoTracking || {};

      const normalizeProfileRecords = Object.entries(profileRecords).reduce((accumulator, [monthKey, value]) => {
        const officeDays = typeof value === 'number' ? value : Number(value?.officeDays ?? value ?? 0);
        const entries = Array.isArray(value?.entries) ? value.entries : [];

        entries.forEach(entry => {
          if (entry?.date && entry?.office) {
            accumulator[entry.date] = {
              date: entry.date,
              office: entry.office,
              updatedAt: entry.updatedAt || new Date().toISOString()
            };
          }
        });

        if (Number.isFinite(officeDays)) {
          this.monthlyFallbackCounts[monthKey] = officeDays;
        }

        return accumulator;
      }, {});

      if (Object.keys(normalizeProfileRecords).length > 0) {
        this.records = normalizeProfileRecords;
        this.saveRecords();
        this.saveFallbackCounts();
        return;
      }

      if (typeof api !== 'undefined' && api.getRTORecords && userId) {
        const remoteRecords = await api.getRTORecords(userId);
        const mappedRemote = { ...localRecords };

        remoteRecords.forEach(record => {
          if (record.monthKey && Number.isFinite(record.officeDays)) {
            this.monthlyFallbackCounts[record.monthKey] = record.officeDays;
          }

          if (Array.isArray(record.entries)) {
            record.entries.forEach(entry => {
              if (entry?.date && entry?.office) {
                mappedRemote[entry.date] = {
                  date: entry.date,
                  office: entry.office,
                  updatedAt: entry.updatedAt || new Date().toISOString()
                };
              }
            });
          }
        });

        this.records = mappedRemote;
      } else {
        this.records = localRecords;
      }

      this.saveRecords();
      this.saveFallbackCounts();
    } catch (error) {
      console.error('Error loading RTO records:', error);
      this.records = {};
    }
  },

  saveRecords() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.records));
  },

  saveFallbackCounts() {
    localStorage.setItem(this.legacyStorageKey, JSON.stringify(this.monthlyFallbackCounts));
  },

  setDefaultMonth() {
    this.selectedMonthKey = this.getMonthKey(new Date());
    this.selectedDateKey = null;
  },

  getSelectedMonthKey() {
    const monthPicker = document.getElementById('rtoMonthPicker');
    return monthPicker?.value || this.selectedMonthKey || this.getMonthKey(new Date());
  },

  getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  getEntriesForMonth(monthKey) {
    return Object.values(this.records)
      .filter(entry => entry?.date && entry.date.startsWith(`${monthKey}-`))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getTrackedDaysForMonth(monthKey) {
    const entries = this.getEntriesForMonth(monthKey);
    if (entries.length > 0) {
      return entries.length;
    }

    const fallback = this.monthlyFallbackCounts[monthKey];
    return Number.isFinite(fallback) ? fallback : 0;
  },

  renderMonthCalendar() {
    const monthPicker = document.getElementById('rtoMonthPicker');
    const calendarGrid = document.getElementById('rtoCalendarGrid');
    if (!monthPicker || !calendarGrid) return;

    const monthKey = this.selectedMonthKey || this.getMonthKey(new Date());
    monthPicker.value = monthKey;

    const [yearText, monthText] = monthKey.split('-');
    const year = Number.parseInt(yearText, 10);
    const monthIndex = Number.parseInt(monthText, 10) - 1;

    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const todayKey = this.getDateKey(new Date());

    calendarGrid.innerHTML = '';

    for (let i = 0; i < firstDay; i += 1) {
      const emptyCell = document.createElement('button');
      emptyCell.type = 'button';
      emptyCell.className = 'rto-day-cell is-empty';
      emptyCell.disabled = true;
      calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      const dateKey = this.getDateKey(date);
      const weekday = date.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const hasEntry = Boolean(this.records[dateKey]);
      const isSelected = dateKey === this.selectedDateKey;

      const dayCell = document.createElement('button');
      dayCell.type = 'button';
      dayCell.className = 'rto-day-cell';
      dayCell.textContent = String(day);
      dayCell.dataset.date = dateKey;

      if (dateKey === todayKey) dayCell.classList.add('is-today');
      if (hasEntry) dayCell.classList.add('is-tracked');
      if (isWeekend) dayCell.classList.add('is-weekend');
      if (isSelected) dayCell.classList.add('is-selected');

      dayCell.addEventListener('click', () => this.selectDate(dateKey));
      calendarGrid.appendChild(dayCell);
    }
  },

  selectDate(dateKey) {
    this.selectedDateKey = dateKey;
    this.renderMonthCalendar();
    this.updateModalDetails();
  },

  populateOfficeSelector() {
    const officeSelect = document.getElementById('rtoOfficeLocationSelect');
    if (!officeSelect) return;

    const options = Array.from(officeSelect.options).map(option => option.value);
    this.officeOptions.forEach(optionValue => {
      if (!options.includes(optionValue)) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        officeSelect.appendChild(option);
      }
    });
  },

  async saveSelectedDay() {
    const statusMessage = document.getElementById('rtoStatusMessage');
    const officeSelect = document.getElementById('rtoOfficeLocationSelect');

    if (!this.selectedDateKey) {
      if (statusMessage) {
        statusMessage.textContent = 'Select a calendar day before saving.';
      }
      return;
    }

    if (!officeSelect?.value) {
      if (statusMessage) {
        statusMessage.textContent = 'Select an office location before saving.';
      }
      return;
    }

    this.records[this.selectedDateKey] = {
      date: this.selectedDateKey,
      office: officeSelect.value,
      updatedAt: new Date().toISOString()
    };

    this.saveRecords();
    await this.syncSelectedMonthToFirebase();

    this.renderMonthCalendar();
    this.updateModalDetails();
    this.updateDashboardCard();

    if (statusMessage) {
      statusMessage.textContent = `Saved ${this.selectedDateKey} as ${officeSelect.value}.`;
    }
  },

  async deleteSelectedDay() {
    const statusMessage = document.getElementById('rtoStatusMessage');

    if (!this.selectedDateKey) {
      if (statusMessage) {
        statusMessage.textContent = 'Select a tracked day to delete.';
      }
      return;
    }

    if (!this.records[this.selectedDateKey]) {
      if (statusMessage) {
        statusMessage.textContent = 'No tracked office day found for that date.';
      }
      return;
    }

    delete this.records[this.selectedDateKey];
    this.saveRecords();
    await this.syncSelectedMonthToFirebase();

    this.renderMonthCalendar();
    this.updateModalDetails();
    this.updateDashboardCard();

    if (statusMessage) {
      statusMessage.textContent = `Deleted tracked entry for ${this.selectedDateKey}.`;
    }
  },

  async deleteDayByDate(dateKey) {
    if (!dateKey || !this.records[dateKey]) return;

    this.selectedDateKey = dateKey;
    await this.deleteSelectedDay();
  },

  async syncSelectedMonthToFirebase() {
    const userId = AppState.currentUser?.id;
    const monthKey = this.getSelectedMonthKey();

    if (!userId || typeof api === 'undefined' || !api.saveRTORecord || !monthKey) {
      return;
    }

    const monthEntries = this.getEntriesForMonth(monthKey);
    const officeDays = monthEntries.length;

    this.monthlyFallbackCounts[monthKey] = officeDays;
    this.saveFallbackCounts();

    try {
      await api.saveRTORecord(userId, monthKey, officeDays, {
        entries: monthEntries.map(entry => ({
          date: entry.date,
          office: entry.office,
          updatedAt: entry.updatedAt || new Date().toISOString()
        }))
      });
    } catch (error) {
      console.warn('Unable to sync RTO record to Firebase:', error);
    }
  },

  renderTrackedDaysList(monthKey) {
    const listEl = document.getElementById('rtoTrackedDaysList');
    if (!listEl) return;

    const entries = this.getEntriesForMonth(monthKey);
    if (entries.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No tracked office days for this month.</p>';
      return;
    }

    listEl.innerHTML = entries.map(entry => `
      <div class="rto-entry-item">
        <div>
          <div class="rto-entry-date">${entry.date}</div>
          <div class="rto-entry-office">${entry.office}</div>
        </div>
        <div class="rto-entry-actions">
          <button type="button" class="btn btn-secondary btn-sm rto-entry-edit-btn" data-date="${entry.date}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm rto-entry-delete-btn" data-date="${entry.date}">Delete</button>
        </div>
      </div>
    `).join('');
  },

  getDisplayDate(dateKey) {
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 'Select a workday on the calendar.';
    const [yearText, monthText, dayText] = dateKey.split('-');
    const date = new Date(Number.parseInt(yearText, 10), Number.parseInt(monthText, 10) - 1, Number.parseInt(dayText, 10));
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  },

  formatMonthKey(monthKey) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return 'selected month';
    const [yearText, monthText] = monthKey.split('-');
    const date = new Date(Number.parseInt(yearText, 10), Number.parseInt(monthText, 10) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  },

  toCSVCell(value) {
    const safeValue = value == null ? '' : String(value);
    return `"${safeValue.replace(/"/g, '""')}"`;
  },

  triggerCSVDownload(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  formatUpdatedAtForCSV(rawValue) {
    if (!rawValue) return '';

    try {
      if (typeof rawValue === 'string') {
        const parsed = new Date(rawValue);
        return Number.isNaN(parsed.getTime()) ? rawValue : parsed.toISOString();
      }

      if (rawValue instanceof Date) {
        return Number.isNaN(rawValue.getTime()) ? '' : rawValue.toISOString();
      }

      if (typeof rawValue?.toDate === 'function') {
        const converted = rawValue.toDate();
        return converted instanceof Date && !Number.isNaN(converted.getTime())
          ? converted.toISOString()
          : '';
      }

      const parsed = new Date(rawValue);
      return Number.isNaN(parsed.getTime()) ? String(rawValue) : parsed.toISOString();
    } catch (_error) {
      return String(rawValue);
    }
  },

  downloadMonthlyCSV() {
    const statusMessage = document.getElementById('rtoStatusMessage');

    try {
      const monthKey = this.getSelectedMonthKey();
      const entries = this.getEntriesForMonth(monthKey);

      if (!monthKey) {
        if (statusMessage) {
          statusMessage.textContent = 'Select a month before downloading CSV.';
        }
        return;
      }

      const filename = `rto-tracked-days-${monthKey}.csv`;
      const header = ['Date', 'Office Location', 'Updated At'];

      const rows = entries.map(entry => [
        entry.date,
        entry.office,
        this.formatUpdatedAtForCSV(entry.updatedAt)
      ]);

      if (rows.length === 0) {
        const fallbackCount = this.getTrackedDaysForMonth(monthKey);
        rows.push([
          `${monthKey}-01`,
          fallbackCount > 0 ? `Tracked days summary: ${fallbackCount}` : 'No tracked days',
          ''
        ]);
      }

      const csv = [header, ...rows]
        .map(row => row.map(value => this.toCSVCell(value)).join(','))
        .join('\n');

      this.triggerCSVDownload(filename, csv);

      if (statusMessage) {
        statusMessage.textContent = rows.length > 0 && entries.length > 0
          ? `Downloaded CSV for ${this.formatMonthKey(monthKey)} (${entries.length} tracked day(s)).`
          : `Downloaded CSV for ${this.formatMonthKey(monthKey)}.`;
      }
    } catch (error) {
      console.error('Unable to download monthly CSV:', error);
      if (statusMessage) {
        statusMessage.textContent = 'Unable to download CSV. Refresh and try again.';
      }
    }
  },

  countWorkdaysInMonth(monthKey) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return 0;

    const [yearText, monthText] = monthKey.split('-');
    const year = Number.parseInt(yearText, 10);
    const monthIndex = Number.parseInt(monthText, 10) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    let workdays = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, monthIndex, day);
      const weekday = date.getDay();
      if (weekday !== 0 && weekday !== 6) {
        workdays += 1;
      }
    }

    return workdays;
  },

  updateDashboardCard() {
    const valueEl = document.getElementById('rtoAverageValue');
    if (!valueEl) return;

    const monthKey = this.getMonthKey(new Date());
    const officeDays = this.getTrackedDaysForMonth(monthKey);
    const workdays = this.countWorkdaysInMonth(monthKey);
    const averageDaysPerWeek = workdays > 0 ? (officeDays / workdays) * 5 : 0;
    const meetsTarget = averageDaysPerWeek >= this.targetDaysPerWeek;

    valueEl.textContent = averageDaysPerWeek.toFixed(1);
    valueEl.classList.toggle('rto-value-good', meetsTarget);
    valueEl.classList.toggle('rto-value-bad', !meetsTarget);
  },

  updateModalDetails() {
    const detailsEl = document.getElementById('rtoMonthDetails');
    const statusEl = document.getElementById('rtoStatusMessage');
    const selectedDateLabel = document.getElementById('rtoSelectedDateLabel');
    const officeSelect = document.getElementById('rtoOfficeLocationSelect');

    if (!detailsEl || !statusEl || !selectedDateLabel || !officeSelect) return;

    const monthKey = this.getSelectedMonthKey();
    const officeDays = this.getTrackedDaysForMonth(monthKey);
    const workdays = this.countWorkdaysInMonth(monthKey);
    const percentage = workdays > 0 ? (officeDays / workdays) * 100 : 0;
    const averageDaysPerWeek = workdays > 0 ? (officeDays / workdays) * 5 : 0;
    const meetsTarget = averageDaysPerWeek >= this.targetDaysPerWeek;

    selectedDateLabel.textContent = this.getDisplayDate(this.selectedDateKey);

    if (this.selectedDateKey && this.records[this.selectedDateKey]?.office) {
      officeSelect.value = this.records[this.selectedDateKey].office;
    }

    detailsEl.textContent = `${officeDays} tracked days / ${workdays} workdays (${percentage.toFixed(0)}%)`;

    statusEl.classList.toggle('rto-status-good', meetsTarget);
    statusEl.classList.toggle('rto-status-bad', !meetsTarget);

    if (meetsTarget) {
      statusEl.textContent = `On track for ${this.formatMonthKey(monthKey)}.`;
    } else {
      const shortfall = Math.max(0, this.targetDaysPerWeek - averageDaysPerWeek);
      statusEl.textContent = `Under target by ${shortfall.toFixed(1)} day(s) per week for ${this.formatMonthKey(monthKey)}.`;
    }

    this.renderTrackedDaysList(monthKey);
  },

  openModal() {
    const modal = document.getElementById('rtoTrackerModal');
    const currentMonth = this.getMonthKey(new Date());

    this.populateOfficeSelector();
    this.selectedMonthKey = currentMonth;
    this.selectedDateKey = null;
    this.renderMonthCalendar();
    this.updateModalDetails();

    modal?.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('rtoTrackerModal');
    modal?.classList.remove('active');
  }
};

// User Interface Management
const UIManager = {
  applicationFilters: {},

  init() {
    this.setupEventListeners();
    this.updateUserProfile();
  },

  refreshTicketDisplays() {
    AppState.updateDashboard();
    this.filterDefects();
    this.filterCRs();
    this.filterIntakes();
    this.filterStories();
    this.filterEpics();
    this.filterTasks();
    this.renderResolvedItems();
    this.searchAllTickets();
    if (typeof CalendarManager !== 'undefined') CalendarManager.renderCalendar();
  },

  setupEventListeners() {
    // Search and filter listeners
    document.getElementById('defectSearchId')?.addEventListener('input', () => this.filterDefects());
    document.getElementById('defectSearchJira')?.addEventListener('input', () => this.filterDefects());
    document.getElementById('defectStatusFilter')?.addEventListener('change', () => this.filterDefects());
    document.getElementById('defectSortJira')?.addEventListener('change', () => this.filterDefects());

    document.getElementById('crSearchId')?.addEventListener('input', () => this.filterCRs());
    document.getElementById('crSearchJira')?.addEventListener('input', () => this.filterCRs());
    document.getElementById('crStatusFilter')?.addEventListener('change', () => this.filterCRs());
    document.getElementById('crSortJira')?.addEventListener('change', () => this.filterCRs());

    document.getElementById('intakeSearchId')?.addEventListener('input', () => this.filterIntakes());
    document.getElementById('intakeSearchJira')?.addEventListener('input', () => this.filterIntakes());
    document.getElementById('intakeStatusFilter')?.addEventListener('change', () => this.filterIntakes());

    document.getElementById('storySearchId')?.addEventListener('input', () => this.filterStories());
    document.getElementById('storySearchJira')?.addEventListener('input', () => this.filterStories());
    document.getElementById('storyStatusFilter')?.addEventListener('change', () => this.filterStories());

    document.getElementById('epicSearchId')?.addEventListener('input', () => this.filterEpics());
    document.getElementById('epicSearchJira')?.addEventListener('input', () => this.filterEpics());
    document.getElementById('epicStatusFilter')?.addEventListener('change', () => this.filterEpics());

    document.getElementById('taskSearchId')?.addEventListener('input', () => this.filterTasks());
    document.getElementById('taskSearchJira')?.addEventListener('input', () => this.filterTasks());
    document.getElementById('taskStatusFilter')?.addEventListener('change', () => this.filterTasks());

    document.getElementById('globalTicketSearch')?.addEventListener('input', () => this.searchAllTickets());

    // Close menus on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeUserMenu();
        closeTestingEnvironmentsModal();
        closeFusionModal();
        closeRTOModal();
      }
    });
  },

  updateUserProfile() {
    const user = AppState.currentUser;
    if (user) {
      const avatar = user.name.charAt(0).toUpperCase();
      document.getElementById('userAvatar').textContent = avatar;
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userMenuAvatar').textContent = avatar;
      document.getElementById('userMenuName').textContent = user.name || 'User Name';
      document.getElementById('userMenuEmail').textContent = user.email || 'No email';
      document.getElementById('userMenuManager').textContent = `Manager: ${user.manager || 'Not Assigned'}`;
    }
    updateMobileGreeting();
  },

  closeUserMenu() {
    closeUserMenu();
  },

  filterDefects() {
    const idSearch = document.getElementById('defectSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('defectSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('defectStatusFilter')?.value || '';
    const sortOrderRaw = document.getElementById('defectSortJira')?.value || 'asc';
    const sortOrder = sortOrderRaw.toLowerCase().startsWith('desc') ? 'desc' : 'asc';

    let filtered = AppState.defects.filter(d => {
      const idMatch = d.id.toLowerCase().includes(idSearch);
      const jiraMatch = d.jiraId.toLowerCase().includes(jiraSearch);
      const statusMatch = !statusFilter || d.status === statusFilter;
      return idMatch && jiraMatch && statusMatch;
    });

    if (sortOrder === 'desc') {
      filtered.sort((a, b) => b.jiraId.localeCompare(a.jiraId));
    } else {
      filtered.sort((a, b) => a.jiraId.localeCompare(b.jiraId));
    }

    this.displayDefects(filtered);
  },

  filterCRs() {
    const idSearch = document.getElementById('crSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('crSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('crStatusFilter')?.value || '';
    const sortOrderRaw = document.getElementById('crSortJira')?.value || 'asc';
    const sortOrder = sortOrderRaw.toLowerCase().startsWith('desc') ? 'desc' : 'asc';

    let filtered = AppState.changeRequests.filter(c => {
      const idMatch = c.id.toLowerCase().includes(idSearch);
      const jiraMatch = c.jiraId.toLowerCase().includes(jiraSearch);
      const statusMatch = !statusFilter || c.status === statusFilter;
      return idMatch && jiraMatch && statusMatch;
    });

    if (sortOrder === 'desc') {
      filtered.sort((a, b) => b.jiraId.localeCompare(a.jiraId));
    } else {
      filtered.sort((a, b) => a.jiraId.localeCompare(b.jiraId));
    }

    this.displayCRs(filtered);
  },

  filterIntakes() {
    const idSearch = document.getElementById('intakeSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('intakeSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('intakeStatusFilter')?.value || '';

    let filtered = AppState.intakes.filter(i => {
      const idMatch = i.id.toLowerCase().includes(idSearch);
      const jiraMatch = i.jiraId.toLowerCase().includes(jiraSearch);
      const statusMatch = !statusFilter || i.status === statusFilter;
      return idMatch && jiraMatch && statusMatch;
    });

    this.displayIntakes(filtered);
  },

  filterStories() {
    const idSearch = document.getElementById('storySearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('storySearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('storyStatusFilter')?.value || '';

    let filtered = AppState.stories.filter(s => {
      const idMatch = s.id.toLowerCase().includes(idSearch);
      const jiraMatch = s.jiraId.toLowerCase().includes(jiraSearch);
      const statusMatch = !statusFilter || s.status === statusFilter;
      return idMatch && jiraMatch && statusMatch;
    });

    this.displayStories(filtered);
  },

  filterEpics() {
    const idSearch = document.getElementById('epicSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('epicSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('epicStatusFilter')?.value || '';

    let filtered = AppState.epics.filter(e => {
      const idMatch = e.id.toLowerCase().includes(idSearch);
      const jiraMatch = e.jiraId.toLowerCase().includes(jiraSearch);
      const statusMatch = !statusFilter || e.status === statusFilter;
      return idMatch && jiraMatch && statusMatch;
    });

    this.displayEpics(filtered);
  },

  filterTasks() {
    const idSearch = document.getElementById('taskSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('taskSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';

    let filtered = AppState.tasks.filter(t => {
      const idMatch = t.id.toLowerCase().includes(idSearch);
      const jiraMatch = t.jiraId.toLowerCase().includes(jiraSearch);
      const statusMatch = !statusFilter || t.status === statusFilter;
      return idMatch && jiraMatch && statusMatch;
    });

    this.displayTasks(filtered);
  },

  searchAllTickets() {
    const query = document.getElementById('globalTicketSearch')?.value.trim().toLowerCase() || '';
    const container = document.getElementById('globalSearchResults');
    if (!container) return;

    if (!query) {
      container.innerHTML = '<p class="empty-state">Enter a JIRA number or assignee to search all tickets.</p>';
      return;
    }

    const ticketGroups = [
      ['defect', 'Defect', AppState.defects],
      ['cr', 'Change Request', AppState.changeRequests],
      ['intake', 'Intake', AppState.intakes],
      ['story', 'Story', AppState.stories],
      ['epic', 'Epic', AppState.epics],
      ['task', 'Task', AppState.tasks],
      ['resolved', 'Resolved', AppState.resolvedItems]
    ];
    const results = ticketGroups.flatMap(([type, label, tickets]) => tickets
      .filter(ticket => (ticket.jiraId || '').toLowerCase().includes(query) || (ticket.assignee || '').toLowerCase().includes(query))
      .map(ticket => ({ ...ticket, searchType: type, typeLabel: type === 'resolved' ? `${ticket.type === 'cr' ? 'Change Request' : ticket.type?.charAt(0).toUpperCase() + ticket.type?.slice(1) || 'Ticket'} (Resolved)` : label }))
    );

    if (results.length === 0) {
      container.innerHTML = '<p class="empty-state">No tickets match that JIRA number or assignee.</p>';
      return;
    }

    container.innerHTML = results.map(ticket => `
      <div class="item-card global-search-result" style="cursor: pointer;" onclick="openGlobalSearchResult('${ticket.searchType}', '${ticket.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${ticket.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${ticket.title || 'No title provided'}</p>
          </div>
          <div>
            <span class="item-card-id">${ticket.typeLabel}</span>
            ${this.renderApplicationBadge(ticket)}
          </div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${ticket.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${ticket.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Priority</span><span class="meta-value">${ticket.priority || 'N/A'}</span></div>
        </div>
      </div>
    `).join('');
  },

  renderApplicationBadge(item) {
    const application = item.application || 'PUB';
    return `<span class="application-badge ${application === 'EDCA' ? 'edca' : 'pub'}">${application}</span>`;
  },

  renderItemsWithAppSeparation(container, items, cardRenderer) {
    const selected = this.applicationFilters[container.id] || '';
    const pubItems = items.filter(item => (item.application || 'PUB') !== 'EDCA');
    const edcaItems = items.filter(item => item.application === 'EDCA');
    const buttons = [['', 'All', items.length], ['PUB', 'PUB', pubItems.length], ['EDCA', 'EDCA', edcaItems.length]]
      .map(([application, label, count]) => `
        <button type="button" class="app-filter-btn ${application ? `${application.toLowerCase()}-filter` : ''} ${selected === application ? 'active' : ''}"
          aria-pressed="${selected === application}" onclick="UIManager.filterByApp('${container.id}', '${application}')">${label} (${count})</button>
      `).join('');
    let cards = selected !== 'EDCA' ? pubItems.map(cardRenderer).join('') : '';
    if (selected !== 'PUB' && edcaItems.length > 0) {
      cards += '<div class="app-section-divider"><div class="app-section-title">EDCA Applications</div></div>';
      cards += edcaItems.map(cardRenderer).join('');
    }
    container.innerHTML = `<div class="app-filter-buttons">${buttons}</div>${cards || '<p class="empty-state">No tickets match your filters.</p>'}`;
  },

  filterByApp(containerId, application) {
    const filterMethods = {
      defectsList: 'filterDefects',
      crsList: 'filterCRs',
      intakesList: 'filterIntakes',
      storiesList: 'filterStories',
      epicsList: 'filterEpics',
      tasksList: 'filterTasks',
      resolvedList: 'renderResolvedItems'
    };
    const method = filterMethods[containerId];
    if (!method) throw new Error('Unsupported ticket list');
    this.applicationFilters[containerId] = application;
    this[method]();
  },

  displayDefects(defects = AppState.defects) {
    const container = document.getElementById('defectsList');
    if (!container) return;

    this.renderItemsWithAppSeparation(container, defects, d => `
      <div class="item-card" data-id="${d.id}" style="cursor: pointer;" onclick="viewItem('defect', '${d.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${d.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${d.title || 'No title provided'}</p>
          </div>
          <div><span class="item-card-id">${d.id}</span> ${this.renderApplicationBadge(d)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${d.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${d.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Due Date</span><span class="meta-value">${d.dueDate || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${d.creationDate || 'N/A'}</span></div>
        </div>
      </div>
    `);
  },

  displayCRs(crs = AppState.changeRequests) {
    const container = document.getElementById('crsList');
    if (!container) return;

    this.renderItemsWithAppSeparation(container, crs, c => `
      <div class="item-card" data-id="${c.id}" style="cursor: pointer;" onclick="viewItem('cr', '${c.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${c.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${c.title || 'No title provided'}</p>
          </div>
          <div><span class="item-card-id">${c.id}</span> ${this.renderApplicationBadge(c)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${c.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${c.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Due Date</span><span class="meta-value">${c.dueDate || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${c.creationDate || 'N/A'}</span></div>
        </div>
      </div>
    `);
  },

  displayIntakes(intakes = AppState.intakes) {
    const container = document.getElementById('intakesList');
    if (!container) return;

    this.renderItemsWithAppSeparation(container, intakes, i => `
      <div class="item-card" data-id="${i.id}" style="cursor: pointer;" onclick="viewItem('intake', '${i.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${i.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${i.title || 'No title provided'}</p>
          </div>
          <div><span class="item-card-id">${i.id}</span> ${this.renderApplicationBadge(i)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${i.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${i.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Due Date</span><span class="meta-value">${i.dueDate || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${i.creationDate || 'N/A'}</span></div>
        </div>
      </div>
    `);
  },

  displayStories(stories = AppState.stories) {
    const container = document.getElementById('storiesList');
    if (!container) return;

    this.renderItemsWithAppSeparation(container, stories, s => `
      <div class="item-card" data-id="${s.id}" style="cursor: pointer;" onclick="viewItem('story', '${s.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${s.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${s.title || 'No title provided'}</p>
          </div>
          <div><span class="item-card-id">${s.id}</span> ${this.renderApplicationBadge(s)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${s.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${s.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Due Date</span><span class="meta-value">${s.dueDate || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${s.creationDate || 'N/A'}</span></div>
        </div>
      </div>
    `);
  },

  displayEpics(epics = AppState.epics) {
    const container = document.getElementById('epicsList');
    if (!container) return;

    this.renderItemsWithAppSeparation(container, epics, e => `
      <div class="item-card" data-id="${e.id}" style="cursor: pointer;" onclick="viewItem('epic', '${e.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${e.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${e.title || 'No title provided'}</p>
          </div>
          <div><span class="item-card-id">${e.id}</span> ${this.renderApplicationBadge(e)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${e.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${e.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Due Date</span><span class="meta-value">${e.dueDate || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${e.creationDate || 'N/A'}</span></div>
        </div>
      </div>
    `);
  },

  displayTasks(tasks = AppState.tasks) {
    const container = document.getElementById('tasksList');
    if (!container) return;

    this.renderItemsWithAppSeparation(container, tasks, t => `
      <div class="item-card" data-id="${t.id}" style="cursor: pointer;" onclick="viewItem('task', '${t.id}')">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${t.jiraId || 'No JIRA ID'}</div>
            <p class="item-card-subtitle">${t.title || 'No title provided'}</p>
          </div>
          <div><span class="item-card-id">${t.id}</span> ${this.renderApplicationBadge(t)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${t.status || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Assignee</span><span class="meta-value">${t.assignee || 'Unassigned'}</span></div>
          <div class="meta-item"><span class="meta-label">Due Date</span><span class="meta-value">${t.dueDate || 'N/A'}</span></div>
          <div class="meta-item"><span class="meta-label">Created</span><span class="meta-value">${t.creationDate || 'N/A'}</span></div>
        </div>
      </div>
    `);
  },

  renderResolvedItems() {
    const container = document.getElementById('resolvedList');
    if (!container) return;

    if (AppState.resolvedItems.length === 0) {
      container.innerHTML = '<p class="empty-state">No resolved items yet.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, AppState.resolvedItems, item => this.createResolvedItemCard(item));
  },

  createResolvedItemCard(item) {
    const icons = { defect: '🐛', cr: '📝', intake: '📥', story: '📖', epic: '🎯', task: '✓' };
    const typeLabels = { 
      defect: 'Defect', 
      cr: 'Change Request', 
      intake: 'Intake', 
      story: 'Story', 
      epic: 'Epic', 
      task: 'Task' 
    };
    
    const icon = icons[item.type] || '✅';
    const typeLabel = typeLabels[item.type] || 'Resolved Item';
    
    return `
      <div class="item-card" style="cursor: pointer;" onclick="viewResolvedTicket('${item.id}')">
        <div class="item-card-header">
          <h3 class="item-card-title">${icon} ${item.jiraId}</h3>
          <div><span class="item-card-id">${item.id}</span> ${this.renderApplicationBadge(item)}</div>
        </div>
        <div class="item-card-meta">
          <div class="meta-item">
            <span class="meta-label">Type</span>
            <span class="meta-value">${typeLabel}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Assignee</span>
            <span class="meta-value">${item.assignee || 'Unassigned'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="priority-badge ${item.priority ? item.priority.toLowerCase() : 'medium'}">${item.priority || 'Medium'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Resolved By</span>
            <span class="meta-value">${item.resolvedBy}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Resolved Date</span>
            <span class="meta-value">${item.resolvedDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created</span>
            <span class="meta-value">${item.creationDate}</span>
          </div>
        </div>
      </div>
    `;
  }
};

// Global helper functions
async function resolveItem(type, id) {
  try {
    if (type === 'defect') {
      await AppState.resolveDefect(id);
    } else if (type === 'cr') {
      await AppState.resolveCR(id);
    } else if (type === 'intake') {
      await AppState.resolveIntake(id);
    } else if (type === 'story') {
      await AppState.resolveStory(id);
    } else if (type === 'epic') {
      await AppState.resolveEpic(id);
    } else if (type === 'task') {
      await AppState.resolveTask(id);
    }
    AppState.updateDashboard();
  } catch (error) {
    alert('Error resolving item: ' + error.message);
  }
}

async function deleteItem(type, id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  try {
    if (type === 'defect') {
      await AppState.deleteDefect(id);
    } else if (type === 'cr') {
      await AppState.deleteCR(id);
    } else if (type === 'intake') {
      await AppState.deleteIntake(id);
    } else if (type === 'story') {
      await AppState.deleteStory(id);
    } else if (type === 'epic') {
      await AppState.deleteEpic(id);
    } else if (type === 'task') {
      await AppState.deleteTask(id);
    }
    AppState.updateDashboard();
  } catch (error) {
    alert('Error deleting item: ' + error.message);
  }
}

function viewItem(type, id) {
  let item;
  if (type === 'defect') item = AppState.defects.find(i => i.id === id);
  else if (type === 'cr') item = AppState.changeRequests.find(i => i.id === id);
  else if (type === 'intake') item = AppState.intakes.find(i => i.id === id);
  else if (type === 'story') item = AppState.stories.find(i => i.id === id);
  else if (type === 'epic') item = AppState.epics.find(i => i.id === id);
  else if (type === 'task') item = AppState.tasks.find(i => i.id === id);

  if (!item) {
    alert('Item not found');
    return;
  }

  // Open modal instead of navigating
  openTicketModal(item, type);
}

function viewResolvedTicket(id) {
  const item = AppState.resolvedItems.find(i => i.id === id);
  if (!item) {
    alert('Resolved item not found');
    return;
  }

  // Open modal instead of navigating
  openTicketModal(item, item.type, true);
}

function openGlobalSearchResult(type, id) {
  if (type === 'resolved') {
    viewResolvedTicket(id);
  } else {
    viewItem(type, id);
  }
}

// ==================== MODAL FUNCTIONS ====================

function escapeDescriptionText(text) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text || '').replace(/[&<>"']/g, character => entities[character]);
}

function renderDescription(description) {
  return String(description || '').split(/(\b(?:https?:\/\/|www\.)[^\s<>"']+)/gi)
    .map((text, index) => {
      if (index % 2 === 0) return escapeDescriptionText(text);

      let url = text;
      while (url) {
        const last = url[url.length - 1];
        const opening = { ')': '(', ']': '[', '}': '{' }[last];
        const unmatchedClosing = opening && url.split(last).length > url.split(opening).length;
        if (!/[.,!?;:]/.test(last) && !unmatchedClosing) break;
        url = url.slice(0, -1);
      }

      const href = /^www\./i.test(url) ? `https://${url}` : url;
      return `<a class="description-link" href="${escapeDescriptionText(href)}" target="_blank" rel="noopener noreferrer">${escapeDescriptionText(url)}</a>${escapeDescriptionText(text.slice(url.length))}`;
    }).join('');
}

function openTicketModal(item, type, isResolved = false) {
  window.currentModalTicket = { item, type, isResolved };
  const modal = document.getElementById('ticketModal');
  const typeLabels = { defect: 'Defect', cr: 'Change Request', intake: 'Intake', story: 'Story', epic: 'Epic', task: 'Task' };
  document.getElementById('modalTitle').textContent = `${typeLabels[type]}: ${item.jiraId}`;
  renderTicketModalContent(item, type);
  modal.classList.add('active');
}

function closeTicketModal() {
  const modal = document.getElementById('ticketModal');
  modal.classList.remove('active');
  window.currentModalTicket = null;
}

function renderTicketModalContent(item, type) {
  const body = document.getElementById('ticketModalBody');
  let html = `
    <div class="ticket-view-section">
      <div class="ticket-view-section-title">Basic Information</div>
      <div class="ticket-view-grid">
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">ID</div>
          <div class="ticket-view-field-value">${item.id || 'N/A'}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">JIRA ID</div>
          <div class="ticket-view-field-value">${item.jiraId || 'N/A'}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Title</div>
          <div class="ticket-view-field-value">${item.title || 'N/A'}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Status</div>
          <div class="ticket-view-field-value"><span class="status-badge ${(item.status || '').toLowerCase().replace(/[\s\/]/g, '-')}">${item.status || 'N/A'}</span></div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Priority</div>
          <div class="ticket-view-field-value"><span class="priority-badge ${(item.priority || '').toLowerCase()}">${item.priority || 'N/A'}</span></div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Application</div>
          <div class="ticket-view-field-value">${UIManager.renderApplicationBadge(item)}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Assignee</div>
          <div class="ticket-view-field-value">${item.assignee || 'Unassigned'}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Created By</div>
          <div class="ticket-view-field-value">${item.createdBy || 'N/A'}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Creation Date</div>
          <div class="ticket-view-field-value">${item.creationDate || 'N/A'}</div>
        </div>
        <div class="ticket-view-field">
          <div class="ticket-view-field-label">Due Date</div>
          <div class="ticket-view-field-value">${item.dueDate || 'N/A'}</div>
        </div>
      </div>
    </div>
  `;

  if (item.description) {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Description</div>
        <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); border-left: 3px solid var(--primary); white-space: pre-wrap; line-height: 1.6;">${renderDescription(item.description)}</div>
      </div>
    `;
  }

  if (type === 'defect' && (item.component || item.severity || item.environment)) {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Defect Details</div>
        <div class="ticket-view-grid">
          ${item.component ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Component</div><div class="ticket-view-field-value">${item.component}</div></div>` : ''}
          ${item.severity ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Severity</div><div class="ticket-view-field-value">${item.severity}</div></div>` : ''}
          ${item.environment ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Environment</div><div class="ticket-view-field-value">${item.environment}</div></div>` : ''}
        </div>
      </div>
    `;
  }

  if (type === 'cr' && (item.changeType || item.impactLevel || item.affectedSystems || item.riskLevel)) {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Change Request Details</div>
        <div class="ticket-view-grid">
          ${item.changeType ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Change Type</div><div class="ticket-view-field-value">${item.changeType}</div></div>` : ''}
          ${item.impactLevel ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Impact Level</div><div class="ticket-view-field-value">${item.impactLevel}</div></div>` : ''}
          ${item.affectedSystems ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Affected Systems</div><div class="ticket-view-field-value">${item.affectedSystems}</div></div>` : ''}
          ${item.riskLevel ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Risk Level</div><div class="ticket-view-field-value">${item.riskLevel}</div></div>` : ''}
        </div>
      </div>
    `;
  }

  if (type === 'intake' && (item.intakeType || item.businessCase || item.requestedBy)) {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Intake Details</div>
        <div class="ticket-view-grid">
          ${item.intakeType ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Intake Type</div><div class="ticket-view-field-value">${item.intakeType}</div></div>` : ''}
          ${item.businessCase ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Business Case</div><div class="ticket-view-field-value">${item.businessCase}</div></div>` : ''}
          ${item.requestedBy ? `<div class="ticket-view-field"><div class="ticket-view-field-label">Requested By</div><div class="ticket-view-field-value">${item.requestedBy}</div></div>` : ''}
        </div>
      </div>
    `;
  }
  // JIRA Link Section
  if (item.jiraLink) {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Links</div>
        <div class="ticket-view-grid">
          <div class="ticket-view-field">
            <div class="ticket-view-field-label">JIRA Link</div>
            <div class="ticket-view-field-value"><a href="${item.jiraLink}" target="_blank" rel="noopener noreferrer" class="view-link">🔗 View in JIRA</a></div>
          </div>
        </div>
      </div>
    `;
  }

  const isResolved = window.currentModalTicket?.isResolved;
  const canRestore = isResolved && ['defect', 'cr'].includes(type);
  html += `
    <div class="ticket-modal-actions">
      ${isResolved ? '' : `<button class="btn btn-secondary" onclick="startModalEditMode()">✏️ Edit</button>`}
      ${isResolved ? '' : `<button class="btn btn-secondary resolve-btn" onclick="resolveFromModal()">✅ Resolve</button>`}
      ${canRestore ? `<button class="btn btn-primary" onclick="restoreFromModal()">↩️ Restore</button>` : ''}
      ${!isResolved && type === 'cr' ? `<button class="btn btn-secondary" onclick="moveCRToIntakeFromModal()">→ Move to Intake</button>` : ''}
      ${!isResolved && type === 'intake' ? `<button class="btn btn-secondary" onclick="moveIntakeToCRFromModal()">→ Move to CR</button>` : ''}
      <button class="btn btn-secondary" onclick="${isResolved ? 'deleteResolvedFromModal()' : 'deleteFromModal()'}">🗑️ Delete</button>
      <button class="btn btn-secondary" onclick="closeTicketModal()">Close</button>
    </div>
  `;

  body.innerHTML = html;
}

function startModalEditMode() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;
  renderModalEditForm(item, type);
}

function renderModalEditForm(item, type) {
  const body = document.getElementById('ticketModalBody');
  
  const priorityOptions = ['Critical', 'High', 'Medium', 'Low'].map(v => `<option value="${v}" ${item.priority === v ? 'selected' : ''}>${v}</option>`).join('');
  const statusOptions = ['Not Started','On Hold','Blocked','In Progress','Code Review/Migration','Ready for Retest','In QA testing','Await UAT Verification','Await PROD Verification','Await PROD Migration','Failed','Resolved','Triage','Withdrawn','Rejected','Deferred','Done'].map(v => `<option value="${v}" ${item.status === v ? 'selected' : ''}>${v}</option>`).join('');

  let html = `
    <div class="ticket-view-section">
      <div class="ticket-view-section-title">Edit ${type === 'cr' ? 'Change Request' : type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="ticket-modal-edit-grid">
        <div class="ticket-modal-edit-field">
          <label class="form-label">JIRA ID</label>
          <input type="text" id="editJiraId" class="form-input" value="${item.jiraId || ''}" readonly />
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label">Title</label>
          <input type="text" id="editTitle" class="form-input" value="${item.title || ''}" />
        </div>
        <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
          <label class="form-label">Description</label>
          <textarea id="editDescription" class="form-input" style="min-height: 100px;">${escapeDescriptionText(item.description)}</textarea>
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label">Priority</label>
          <select id="editPriority" class="form-input">${priorityOptions}</select>
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label">Status</label>
          <select id="editStatus" class="form-input">${statusOptions}</select>
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label" for="editApplication">Application</label>
          <select id="editApplication" class="form-input">
            <option value="PUB" ${!item.application || item.application === 'PUB' ? 'selected' : ''}>PUB</option>
            <option value="EDCA" ${item.application === 'EDCA' ? 'selected' : ''}>EDCA</option>
          </select>
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label">Assignee</label>
          <input type="text" id="editAssignee" class="form-input" value="${item.assignee || ''}" />
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label">Due Date</label>
          <input type="date" id="editDueDate" class="form-input" value="${item.dueDate || ''}" />
        </div>
        <div class="ticket-modal-edit-field">
          <label class="form-label">JIRA Link</label>
          <input type="url" id="editJiraLink" class="form-input" value="${item.jiraLink || ''}" />
        </div>
      </div>
    </div>
  `;

  if (type === 'defect') {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Defect Details</div>
        <div class="ticket-modal-edit-grid">
          <div class="ticket-modal-edit-field">
            <label class="form-label">Component</label>
            <input type="text" id="editComponent" class="form-input" value="${item.component || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Severity</label>
            <input type="text" id="editSeverity" class="form-input" value="${item.severity || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Environment</label>
            <input type="text" id="editEnvironment" class="form-input" value="${item.environment || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'cr') {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Change Request Details</div>
        <div class="ticket-modal-edit-grid">
          <div class="ticket-modal-edit-field">
            <label class="form-label">Change Type</label>
            <input type="text" id="editChangeType" class="form-input" value="${item.changeType || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Impact Level</label>
            <input type="text" id="editImpactLevel" class="form-input" value="${item.impactLevel || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Affected Systems</label>
            <input type="text" id="editAffectedSystems" class="form-input" value="${item.affectedSystems || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Risk Level</label>
            <input type="text" id="editRiskLevel" class="form-input" value="${item.riskLevel || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'intake') {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Intake Details</div>
        <div class="ticket-modal-edit-grid">
          <div class="ticket-modal-edit-field">
            <label class="form-label">Intake Type</label>
            <input type="text" id="editIntakeType" class="form-input" value="${item.intakeType || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Business Case</label>
            <input type="text" id="editBusinessCase" class="form-input" value="${item.businessCase || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Requested By</label>
            <input type="text" id="editRequestedBy" class="form-input" value="${item.requestedBy || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Start Date</label>
            <input type="date" id="editStartDate" class="form-input" value="${item.startDate || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'story') {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Story Details</div>
        <div class="ticket-modal-edit-grid">
          <div class="ticket-modal-edit-field">
            <label class="form-label">Story Points</label>
            <input type="text" id="editStoryPoints" class="form-input" value="${item.storyPoints || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Related Epic</label>
            <input type="text" id="editRelatedEpic" class="form-input" value="${item.relatedEpic || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Acceptance Criteria</label>
            <input type="text" id="editAcceptanceCriteria" class="form-input" value="${item.acceptanceCriteria || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Start Date</label>
            <input type="date" id="editStartDate" class="form-input" value="${item.startDate || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'epic') {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Epic Details</div>
        <div class="ticket-modal-edit-grid">
          <div class="ticket-modal-edit-field">
            <label class="form-label">Initiative</label>
            <input type="text" id="editInitiative" class="form-input" value="${item.initiative || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Scope</label>
            <input type="text" id="editScope" class="form-input" value="${item.scope || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Business Impact</label>
            <input type="text" id="editBusinessImpact" class="form-input" value="${item.businessImpact || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Stakeholders</label>
            <input type="text" id="editStakeholders" class="form-input" value="${item.stakeholders || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Start Date</label>
            <input type="date" id="editStartDate" class="form-input" value="${item.startDate || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  if (type === 'task') {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Task Details</div>
        <div class="ticket-modal-edit-grid">
          <div class="ticket-modal-edit-field">
            <label class="form-label">Task Type</label>
            <input type="text" id="editTaskType" class="form-input" value="${item.taskType || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Effort Estimate</label>
            <input type="text" id="editEffortEstimate" class="form-input" value="${item.effortEstimate || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Acceptance Criteria</label>
            <input type="text" id="editAcceptanceCriteria" class="form-input" value="${item.acceptanceCriteria || ''}" />
          </div>
          <div class="ticket-modal-edit-field ticket-modal-edit-field-full">
            <label class="form-label">Dependencies</label>
            <input type="text" id="editDependencies" class="form-input" value="${item.dependencies || ''}" />
          </div>
          <div class="ticket-modal-edit-field">
            <label class="form-label">Related Item</label>
            <input type="text" id="editRelatedItem" class="form-input" value="${item.relatedItem || ''}" />
          </div>
        </div>
      </div>
    `;
  }

  html += `
    <div class="ticket-modal-actions">
      <button class="btn btn-secondary" onclick="cancelModalEdit()">Cancel</button>
      <button class="btn btn-primary" onclick="saveModalChanges()">Save Changes</button>
    </div>
  `;

  body.innerHTML = html;
}

async function saveModalChanges() {
  if (!window.currentModalTicket || window.currentModalTicket.isSaving) return;
  const modalTicket = window.currentModalTicket;
  const { item, type } = modalTicket;

  const updated = { ...item };
  updated.title = document.getElementById('editTitle')?.value.trim() || updated.title;
  updated.description = document.getElementById('editDescription')?.value.trim() || updated.description;
  updated.priority = document.getElementById('editPriority')?.value || updated.priority;
  updated.application = document.getElementById('editApplication').value;
  updated.status = document.getElementById('editStatus')?.value || updated.status;
  updated.assignee = document.getElementById('editAssignee')?.value.trim() || updated.assignee;
  updated.dueDate = document.getElementById('editDueDate')?.value || updated.dueDate;
  updated.jiraLink = document.getElementById('editJiraLink')?.value.trim() || updated.jiraLink;

  if (type === 'defect') {
    updated.component = document.getElementById('editComponent')?.value.trim() || updated.component;
    updated.severity = document.getElementById('editSeverity')?.value || updated.severity;
    updated.environment = document.getElementById('editEnvironment')?.value || updated.environment;
  }
  if (type === 'cr') {
    updated.changeType = document.getElementById('editChangeType')?.value || updated.changeType;
    updated.impactLevel = document.getElementById('editImpactLevel')?.value || updated.impactLevel;
    updated.affectedSystems = document.getElementById('editAffectedSystems')?.value.trim() || updated.affectedSystems;
    updated.riskLevel = document.getElementById('editRiskLevel')?.value || updated.riskLevel;
  }
  if (type === 'intake') {
    updated.intakeType = document.getElementById('editIntakeType')?.value || updated.intakeType;
    updated.businessCase = document.getElementById('editBusinessCase')?.value.trim() || updated.businessCase;
    updated.requestedBy = document.getElementById('editRequestedBy')?.value.trim() || updated.requestedBy;
    updated.startDate = document.getElementById('editStartDate')?.value || updated.startDate;
  }
  if (type === 'story') {
    updated.storyPoints = document.getElementById('editStoryPoints')?.value || updated.storyPoints;
    updated.acceptanceCriteria = document.getElementById('editAcceptanceCriteria')?.value.trim() || updated.acceptanceCriteria;
    updated.relatedEpic = document.getElementById('editRelatedEpic')?.value.trim() || updated.relatedEpic;
    updated.startDate = document.getElementById('editStartDate')?.value || updated.startDate;
  }
  if (type === 'epic') {
    updated.initiative = document.getElementById('editInitiative')?.value.trim() || updated.initiative;
    updated.scope = document.getElementById('editScope')?.value.trim() || updated.scope;
    updated.businessImpact = document.getElementById('editBusinessImpact')?.value.trim() || updated.businessImpact;
    updated.stakeholders = document.getElementById('editStakeholders')?.value.trim() || updated.stakeholders;
    updated.startDate = document.getElementById('editStartDate')?.value || updated.startDate;
  }
  if (type === 'task') {
    updated.taskType = document.getElementById('editTaskType')?.value || updated.taskType;
    updated.effortEstimate = document.getElementById('editEffortEstimate')?.value || updated.effortEstimate;
    updated.acceptanceCriteria = document.getElementById('editAcceptanceCriteria')?.value.trim() || updated.acceptanceCriteria;
    updated.dependencies = document.getElementById('editDependencies')?.value.trim() || updated.dependencies;
    updated.relatedItem = document.getElementById('editRelatedItem')?.value.trim() || updated.relatedItem;
    updated.startDate = document.getElementById('editStartDate')?.value || updated.startDate;
  }

  modalTicket.isSaving = true;
  try {
    await AppState.updateTicket(type, updated);
    if (window.currentModalTicket === modalTicket) closeTicketModal();
    UIManager.refreshTicketDisplays();
  } catch (error) {
    alert('Error saving changes: ' + error.message);
  } finally {
    modalTicket.isSaving = false;
  }
}

function cancelModalEdit() {
  if (!window.currentModalTicket) return;
  renderTicketModalContent(window.currentModalTicket.item, window.currentModalTicket.type);
}

async function resolveFromModal() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;

  if (!confirm('Mark this item as Resolved?')) return;

  try {
    if (type === 'defect') {
      await AppState.resolveDefect(item.id);
    } else if (type === 'cr') {
      await AppState.resolveCR(item.id);
    } else if (type === 'intake') {
      await AppState.resolveIntake(item.id);
    } else if (type === 'story') {
      await AppState.resolveStory(item.id);
    } else if (type === 'epic') {
      await AppState.resolveEpic(item.id);
    } else if (type === 'task') {
      await AppState.resolveTask(item.id);
    }

    alert('Item resolved and saved!');
    closeTicketModal();
    
    if (type === 'defect') UIManager.filterDefects();
    else if (type === 'cr') UIManager.filterCRs();
    else if (type === 'intake') UIManager.filterIntakes();
    else if (type === 'story') UIManager.filterStories();
    else if (type === 'epic') UIManager.filterEpics();
    else if (type === 'task') UIManager.filterTasks();
  } catch (error) {
    alert('Error resolving item: ' + error.message);
  }
}

async function restoreFromModal() {
  if (!window.currentModalTicket?.isResolved) return;
  const { item, type } = window.currentModalTicket;

  if (!['defect', 'cr'].includes(type)) return;
  if (!confirm(`Restore this ${type === 'defect' ? 'Defect' : 'Change Request'} as Open?`)) return;

  try {
    await AppState.restoreResolvedItem(item.resolvedId || item.id);
    alert('Item restored successfully.');
    closeTicketModal();
    UIManager.renderResolvedItems();
    if (type === 'defect') UIManager.filterDefects();
    else UIManager.filterCRs();
  } catch (error) {
    alert('Error restoring item: ' + error.message);
  }
}

async function deleteResolvedFromModal() {
  if (!window.currentModalTicket?.isResolved) return;
  const { item } = window.currentModalTicket;
  await deleteResolved(item.resolvedId || item.id);
  closeTicketModal();
}

async function deleteFromModal() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;

  if (!confirm('Delete this item permanently?')) return;

  try {
    if (type === 'defect') {
      await AppState.deleteDefect(item.id);
      UIManager.filterDefects();
    } else if (type === 'cr') {
      await AppState.deleteCR(item.id);
      UIManager.filterCRs();
    } else if (type === 'intake') {
      await AppState.deleteIntake(item.id);
      UIManager.filterIntakes();
    } else if (type === 'story') {
      await AppState.deleteStory(item.id);
      UIManager.filterStories();
    } else if (type === 'epic') {
      await AppState.deleteEpic(item.id);
      UIManager.filterEpics();
    } else if (type === 'task') {
      await AppState.deleteTask(item.id);
      UIManager.filterTasks();
    }

    alert('Item deleted successfully!');
    closeTicketModal();
  } catch (error) {
    alert('Error deleting item: ' + error.message);
  }
}

async function moveCRToIntakeFromModal() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;
  
  if (type !== 'cr') {
    alert('This action is only available for Change Requests');
    return;
  }

  if (!confirm('Move this Change Request to Intake?')) return;

  try {
    await AppState.moveCRToIntake(item.id);
    alert('Change Request moved to Intake successfully.');
    closeTicketModal();
    UIManager.filterCRs();
    UIManager.filterIntakes();
  } catch (error) {
    alert('Error moving item: ' + error.message);
  }
}

async function moveIntakeToCRFromModal() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;
  
  if (type !== 'intake') {
    alert('This action is only available for Intakes');
    return;
  }

  if (!confirm('Move this Intake to Change Request?')) return;

  try {
    await AppState.moveIntakeToCR(item.id);
    alert('Intake moved to Change Request successfully.');
    closeTicketModal();
    UIManager.filterCRs();
    UIManager.filterIntakes();
  } catch (error) {
    alert('Error moving item: ' + error.message);
  }
}

async function deleteResolved(itemId) {
  if (!confirm('Are you sure you want to delete this resolved item?')) return;
  
  try {
    await api.deleteResolved(itemId);
    AppState.resolvedItems = AppState.resolvedItems.filter(item => item.id !== itemId);
    UIManager.renderResolvedItems();
    AppState.updateDashboard();
  } catch (error) {
    alert('Error deleting resolved item: ' + error.message);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  initializeTheme();
  initializeSidebarState();
  initializeWorldClocks();
  updateMobileGreeting();
  await AppState.init();
  await RTOTracker.init();
  UIManager.init();
  // Start auto-refresh of recent activity
  AppState.startRecentActivityAutoRefresh();
});

// Close user menu when clicking outside
document.addEventListener('click', () => {
  const menu = document.getElementById('userMenu');
  if (menu?.classList.contains('active')) {
    closeUserMenu();
  }
});

// Show/Hide Sections
function showSection(sectionName, event) {
  if (event) {
    event.preventDefault();
  }

  // Hide all sections by removing active class
  document.querySelectorAll('section').forEach(section => {
    section.classList.remove('active');
  });

  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected section by adding active class
  const section = document.getElementById(sectionName + '-section');
  if (section) {
    section.classList.add('active');
  }

  // Mark nav item as active
  if (event?.target) {
    event.target.closest('.nav-item')?.classList.add('active');
  }

  // Load profile data if switching to profile sections
  if (sectionName === 'myProfile') {
    loadProfileDisplay();
  } else if (sectionName === 'editProfile') {
    loadProfileEdit();
  } else if (sectionName === 'myRoles') {
    loadRolesDisplay();
  }

  // Render list views for section navigation
  if (sectionName === 'defects') {
    UIManager.filterDefects();
  } else if (sectionName === 'changeRequests') {
    UIManager.filterCRs();
  } else if (sectionName === 'intakes') {
    UIManager.filterIntakes();
  } else if (sectionName === 'stories') {
    UIManager.filterStories();
  } else if (sectionName === 'epics') {
    UIManager.filterEpics();
  } else if (sectionName === 'tasks') {
    UIManager.filterTasks();
  } else if (sectionName === 'searchAll') {
    UIManager.searchAllTickets();
  } else if (sectionName === 'resolved') {
    UIManager.renderResolvedItems();
  }

  syncMobileNav(sectionName);
  closeMobileMenu();
}

function syncMobileNav(sectionName) {
  const items = document.querySelectorAll('.mobile-nav-item');
  const hasDirectMatch = Array.from(items).some(item => item.dataset.section === sectionName);
  items.forEach(item => {
    const target = hasDirectMatch ? sectionName : 'more';
    item.classList.toggle('active', item.dataset.section === target);
  });
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const isOpen = !sidebar?.classList.contains('mobile-open');
  sidebar?.classList.toggle('mobile-open', isOpen);
  document.getElementById('mobileMenuBackdrop')?.classList.toggle('active', isOpen);
  document.body.classList.toggle('mobile-menu-open', isOpen);
}

function closeMobileMenu() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('mobileMenuBackdrop')?.classList.remove('active');
  document.body.classList.remove('mobile-menu-open');
}

function updateMobileGreeting() {
  const dateEl = document.getElementById('mobileGreetingDate');
  const titleEl = document.getElementById('mobileGreetingTitle');
  if (!dateEl || !titleEl) return;

  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (AppState.currentUser?.name || '').trim().split(/\s+/)[0];

  dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  titleEl.textContent = firstName ? `${partOfDay}, ${firstName}` : partOfDay;
}

function navigateToPage(page) {
  window.location.href = page;
}

function openTestingEnvironmentsModal() {
  const modal = document.getElementById('testingEnvironmentsModal');
  modal?.classList.add('active');
}

function closeTestingEnvironmentsModal() {
  const modal = document.getElementById('testingEnvironmentsModal');
  modal?.classList.remove('active');
}

function openEdcaEnvironmentsModal() {
  const modal = document.getElementById('edcaEnvironmentsModal');
  modal?.classList.add('active');
}

function closeEdcaEnvironmentsModal() {
  const modal = document.getElementById('edcaEnvironmentsModal');
  modal?.classList.remove('active');
}

function openSiteLinksModal() {
  const modal = document.getElementById('siteLinksModal');
  modal?.classList.add('active');
}

function closeSiteLinksModal() {
  const modal = document.getElementById('siteLinksModal');
  modal?.classList.remove('active');
}

function openHighPriorityModal() {
  const isHigh = i => i.priority === 'Critical' || i.priority === 'High';
  const groups = [
    ['defect', 'Defect', AppState.defects],
    ['cr', 'Change Request', AppState.changeRequests],
    ['intake', 'Intake', AppState.intakes],
    ['story', 'Story', AppState.stories],
    ['epic', 'Epic', AppState.epics],
    ['task', 'Task', AppState.tasks]
  ];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rows = groups.flatMap(([type, label, list]) =>
    (list || []).filter(isHigh).map(item => `
      <div class="activity-item" style="cursor: pointer;" onclick="closeHighPriorityModal(); viewItem('${type}', '${esc(item.id)}')">
        <div class="activity-content">
          <div class="activity-title">${esc(item.title || item.jiraId || item.id || 'Untitled')}</div>
          <div class="activity-meta">
            <div class="activity-meta-item"><span class="activity-meta-label">Type:</span> <span>${label}</span></div>
            <div class="activity-meta-item"><span class="activity-meta-label">ID:</span> <span>${esc(item.jiraId || 'N/A')}</span></div>
            <div class="activity-meta-item"><span class="activity-meta-label">Priority:</span> <span>${esc(item.priority)}</span></div>
            <div class="activity-meta-item"><span class="activity-meta-label">Status:</span> <span>${esc(item.status || 'N/A')}</span></div>
          </div>
        </div>
      </div>`)
  );
  document.getElementById('highPriorityModalBody').innerHTML = rows.length
    ? rows.join('')
    : '<p>No high priority items.</p>';
  document.getElementById('highPriorityModal')?.classList.add('active');
}

function closeHighPriorityModal() {
  document.getElementById('highPriorityModal')?.classList.remove('active');
}

function openFusionModal() {
  const modal = document.getElementById('fusionModal');
  modal?.classList.add('active');
}

function closeFusionModal() {
  const modal = document.getElementById('fusionModal');
  modal?.classList.remove('active');
}

function openRTOModal() {
  RTOTracker.openModal();
}

function closeRTOModal() {
  RTOTracker.closeModal();
}

// Load and display profile information
function loadProfileDisplay() {
  const user = AppState.currentUser;
  if (user) {
    const roles = AppState.normalizeRoles(user.roles);
    document.getElementById('displayProfileName').textContent = user.name || '-';
    document.getElementById('displayProfileEmail').textContent = user.email || '-';
    document.getElementById('displayProfileManager').textContent = user.manager || 'Not Assigned';
    document.getElementById('displayProfileDepartment').textContent = user.department || '-';
    document.getElementById('displayProfileMemberSince').textContent = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString();
    document.getElementById('displayProfileRoles').textContent = roles.length > 0
      ? roles.join(', ')
      : 'No roles assigned';
  }
}

// Load and populate profile edit form
function loadProfileEdit() {
  const user = AppState.currentUser;
  if (user) {
    const roles = AppState.normalizeRoles(user.roles);
    document.getElementById('editProfileName').value = user.name || '';
    document.getElementById('editProfileEmail').value = user.email || '';
    document.getElementById('editProfileManager').value = user.manager || '';
    document.getElementById('editProfileDepartment').value = user.department || '';
    populateEditRoles(roles);
  }
}

function populateEditRoles(selectedRoles = []) {
  const rolesGrid = document.getElementById('editRolesGrid');
  if (!rolesGrid) return;

  const normalizedSelected = AppState.normalizeRoles(selectedRoles);
  rolesGrid.innerHTML = PUB_ROLES.map((role, index) => {
    const shortRole = role.split('_').slice(-3).join('_');
    const checked = normalizedSelected.includes(role) ? 'checked' : '';
    return `
      <div class="role-checkbox">
        <input type="checkbox" id="editRole_${index}" name="editRoles" value="${role}" ${checked}>
        <label for="editRole_${index}" title="${role}">${shortRole}</label>
      </div>
    `;
  }).join('');
}

// Load and display user roles
function loadRolesDisplay() {
  const user = AppState.currentUser;
  const rolesList = document.getElementById('displayRolesList');
  if (!rolesList) return;
  const roles = AppState.normalizeRoles(user?.roles);
  
  if (roles.length > 0) {
    rolesList.innerHTML = roles.map(role => {
      const shortRole = role.split('_').slice(-3).join('_');
      return `<div class="role-item" title="${role}">${shortRole}</div>`;
    }).join('');
  } else {
    rolesList.innerHTML = '<p>No roles assigned</p>';
  }
}

// Save profile changes
async function saveProfileChanges() {
  const name = document.getElementById('editProfileName').value.trim();
  const email = document.getElementById('editProfileEmail').value.trim();
  const manager = document.getElementById('editProfileManager').value.trim();
  const department = document.getElementById('editProfileDepartment').value.trim();
  const selectedRoles = Array.from(document.querySelectorAll('#editRolesGrid input[name="editRoles"]:checked')).map(cb => cb.value);
  const roles = AppState.normalizeRoles(selectedRoles);

  if (!name) {
    alert('Name is required');
    return;
  }

  try {
    // Save to Firestore via API
    const updatedUser = await api.updateUser(AppState.userId, {
      name,
      email,
      manager,
      department,
      roles
    });

    // Update current user in memory
    const updatedRoles = AppState.normalizeRoles(updatedUser.roles || AppState.currentUser.roles || []);
    AppState.currentUser = {
      ...AppState.currentUser,
      name: updatedUser.name,
      email: updatedUser.email,
      manager: updatedUser.manager,
      department: updatedUser.department,
      roles: updatedRoles
    };

    // Save to sessionStorage
    sessionStorage.setItem('loggedInUser', JSON.stringify(AppState.currentUser));

    // Update UI
    UIManager.updateUserProfile();
    loadProfileDisplay();
    loadRolesDisplay();

    alert('Profile updated successfully!');
  } catch (error) {
    alert('Error saving profile: ' + error.message);
  }
}

// Reset profile form
function resetProfileForm() {
  loadProfileEdit();
}

function toggleUserMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('userMenu');
  const overlay = document.getElementById('userMenuOverlay');
  menu?.classList.toggle('active');
  overlay?.classList.toggle('active');
}

function closeUserMenu() {
  const menu = document.getElementById('userMenu');
  const overlay = document.getElementById('userMenuOverlay');
  menu?.classList.remove('active');
  overlay?.classList.remove('active');
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('pub_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', resolvedTheme);
  localStorage.setItem('pub_theme', resolvedTheme);

  const themeIcon = document.getElementById('themeToggleIcon');
  const themeLabel = document.getElementById('themeToggleLabel');
  if (themeIcon) {
    themeIcon.textContent = resolvedTheme === 'dark' ? '☀️' : '🌙';
  }
  if (themeLabel) {
    themeLabel.textContent = resolvedTheme === 'dark' ? 'Light' : 'Dark';
  }
  
  // Update logo based on theme
  updateLogo(resolvedTheme);
}

function updateLogo(theme) {
  const logoImage = document.querySelector('.header-logo-image');
  if (logoImage) {
    logoImage.src = theme === 'dark' ? 'Pub-Manager-Darkmode-Logo.png' : 'pub-manager-logo.png';
  }
}

function toggleTheme() {
  const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

function initializeSidebarState() {
  const isCollapsed = localStorage.getItem('pub_sidebar_collapsed') === 'true';
  setSidebarCollapsed(isCollapsed);
}

function setSidebarCollapsed(collapsed) {
  const sidebar = document.getElementById('sidebar');
  sidebar?.classList.toggle('collapsed', collapsed);
  localStorage.setItem('pub_sidebar_collapsed', String(collapsed));
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
}

// CSV Export Functions
function exportToCSV(data, filename) {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data to export');
    return;
  }

  const allKeys = [...new Set(data.flatMap(item => Object.keys(item || {})))];
  if (allKeys.length === 0) {
    alert('No data to export');
    return;
  }

  const header = allKeys.join(',');
  const rows = data.map(item => {
    return allKeys.map(key => {
      const value = item?.[key] ?? '';
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
        ? `"${escaped}"`
        : escaped;
    }).join(',');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke on a short delay to avoid canceling download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportDefects() {
  exportToCSV(AppState.defects, `defects_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportChangeRequests() {
  exportToCSV(AppState.changeRequests, `changeRequests_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportIntakes() {
  exportToCSV(AppState.intakes, `intakes_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportStories() {
  exportToCSV(AppState.stories, `stories_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportEpics() {
  exportToCSV(AppState.epics, `epics_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportTasks() {
  exportToCSV(AppState.tasks, `tasks_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportResolvedItems() {
  exportToCSV(AppState.resolvedItems, `resolvedItems_${new Date().toISOString().split('T')[0]}.csv`);
}

const WORLD_CLOCKS = [
  { id: 'clock-philadelphia', timeZone: 'America/New_York' },
  { id: 'clock-chicago', timeZone: 'America/Chicago' },
  { id: 'clock-los-angeles', timeZone: 'America/Los_Angeles' },
  { id: 'clock-london', timeZone: 'Europe/London' },
  { id: 'clock-mumbai', timeZone: 'Asia/Kolkata' }
];

function updateWorldClocks() {
  WORLD_CLOCKS.forEach(clock => {
    const element = document.getElementById(clock.id);
    if (!element) return;

    element.textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: clock.timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date());
  });
}

function initializeWorldClocks() {
  updateWorldClocks();
  window.setInterval(updateWorldClocks, 1000);
}

// Logout function
function logout() {
  sessionStorage.removeItem('loggedInUser');
  if (window.api?.signOut) {
    window.api.signOut().finally(() => {
      window.location.href = 'login.html';
    });
    return;
  }
  window.location.href = 'login.html';
}
