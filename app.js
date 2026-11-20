/* ==========================================
   PUB MANAGER - CORE APPLICATION LOGIC
   ========================================== */

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
  
  init() {
    this.loadUser();
    this.loadData();
    this.updateDashboard();
  },

  loadUser() {
    const userJson = sessionStorage.getItem('loggedInUser');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
    } else {
      window.location.href = 'login.html';
    }
  },

  loadData() {
    // Load defects
    const storedDefects = localStorage.getItem('pub_defects');
    this.defects = storedDefects ? JSON.parse(storedDefects) : [];

    // Load change requests
    const storedCRs = localStorage.getItem('pub_changeRequests');
    this.changeRequests = storedCRs ? JSON.parse(storedCRs) : [];

    // Load resolved items
    const storedResolved = localStorage.getItem('pub_resolved');
    this.resolvedItems = storedResolved ? JSON.parse(storedResolved) : [];

    // Load intakes
    const storedIntakes = localStorage.getItem('pub_intakes');
    this.intakes = storedIntakes ? JSON.parse(storedIntakes) : [];

    // Load stories
    const storedStories = localStorage.getItem('pub_stories');
    this.stories = storedStories ? JSON.parse(storedStories) : [];

    // Load epics
    const storedEpics = localStorage.getItem('pub_epics');
    this.epics = storedEpics ? JSON.parse(storedEpics) : [];

    // Load tasks
    const storedTasks = localStorage.getItem('pub_tasks');
    this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
  },

  saveData() {
    localStorage.setItem('pub_defects', JSON.stringify(this.defects));
    localStorage.setItem('pub_changeRequests', JSON.stringify(this.changeRequests));
    localStorage.setItem('pub_resolved', JSON.stringify(this.resolvedItems));
    localStorage.setItem('pub_intakes', JSON.stringify(this.intakes));
    localStorage.setItem('pub_stories', JSON.stringify(this.stories));
    localStorage.setItem('pub_epics', JSON.stringify(this.epics));
    localStorage.setItem('pub_tasks', JSON.stringify(this.tasks));
  },

  addDefect(defect) {
    const id = this.generateId();
    defect.id = id;
    defect.creationDate = new Date().toISOString().split('T')[0];
    defect.createdBy = this.currentUser.name;
    defect.status = defect.status || 'Open';
    this.defects.push(defect);
    this.saveData();
    this.logActivity(`Added defect ${defect.jiraId}`, '🐛');
    return defect;
  },

  addChangeRequest(cr) {
    const id = this.generateId();
    cr.id = id;
    cr.creationDate = new Date().toISOString().split('T')[0];
    cr.createdBy = this.currentUser.name;
    cr.status = cr.status || 'Open';
    this.changeRequests.push(cr);
    this.saveData();
    this.logActivity(`Added change request ${cr.jiraId}`, '📝');
    return cr;
  },

  resolveDefect(defectId) {
    const defect = this.defects.find(d => d.id === defectId);
    if (defect) {
      defect.status = 'Resolved';
      defect.resolvedDate = new Date().toISOString().split('T')[0];
      defect.resolvedBy = this.currentUser.name;
      this.resolvedItems.push({ ...defect, type: 'defect' });
      this.defects = this.defects.filter(d => d.id !== defectId);
      this.saveData();
      this.logActivity(`Resolved defect ${defect.jiraId}`, '✅');
    }
  },

  resolveCR(crId) {
    const cr = this.changeRequests.find(c => c.id === crId);
    if (cr) {
      cr.status = 'Resolved';
      cr.resolvedDate = new Date().toISOString().split('T')[0];
      cr.resolvedBy = this.currentUser.name;
      this.resolvedItems.push({ ...cr, type: 'cr' });
      this.changeRequests = this.changeRequests.filter(c => c.id !== crId);
      this.saveData();
      this.logActivity(`Resolved change request ${cr.jiraId}`, '✅');
    }
  },

  deleteDefect(defectId) {
    this.defects = this.defects.filter(d => d.id !== defectId);
    this.saveData();
  },

  deleteCR(crId) {
    this.changeRequests = this.changeRequests.filter(c => c.id !== crId);
    this.saveData();
  },

  moveCRToIntake(crId) {
    const cr = this.changeRequests.find(c => c.id === crId);
    if (cr) {
      // Create an intake from the CR
      const intake = {
        ...cr,
        intakeType: cr.changeType || '',
        businessCase: cr.affectedSystems || '',
        requestedBy: cr.requestedBy || 'Unknown',
        startDate: cr.creationDate
      };
      this.intakes.push(intake);
      // Remove from change requests
      this.changeRequests = this.changeRequests.filter(c => c.id !== crId);
      this.saveData();
      this.logActivity(`Moved change request ${cr.jiraId} to Intake`, '📥');
    }
  },

  moveIntakeToCR(intakeId) {
    const intake = this.intakes.find(i => i.id === intakeId);
    if (intake) {
      // Create a CR from the intake
      const cr = {
        ...intake,
        changeType: intake.intakeType || '',
        impactLevel: '',
        affectedSystems: intake.businessCase || '',
        riskLevel: ''
      };
      this.changeRequests.push(cr);
      // Remove from intakes
      this.intakes = this.intakes.filter(i => i.id !== intakeId);
      this.saveData();
      this.logActivity(`Moved intake ${intake.jiraId} to Change Request`, '📝');
    }
  },

  addIntake(intake) {
    const id = this.generateId();
    intake.id = id;
    intake.creationDate = new Date().toISOString().split('T')[0];
    intake.createdBy = this.currentUser.name;
    intake.status = 'Not Started';
    this.intakes.push(intake);
    this.saveData();
    this.logActivity(`Added intake ${intake.jiraId}`, '📥');
    return intake;
  },

  addStory(story) {
    const id = this.generateId();
    story.id = id;
    story.creationDate = new Date().toISOString().split('T')[0];
    story.createdBy = this.currentUser.name;
    story.status = 'Not Started';
    this.stories.push(story);
    this.saveData();
    this.logActivity(`Added story ${story.jiraId}`, '📖');
    return story;
  },

  addEpic(epic) {
    const id = this.generateId();
    epic.id = id;
    epic.creationDate = new Date().toISOString().split('T')[0];
    epic.createdBy = this.currentUser.name;
    epic.status = 'Planning';
    this.epics.push(epic);
    this.saveData();
    this.logActivity(`Added epic ${epic.jiraId}`, '🎯');
    return epic;
  },

  addTask(task) {
    const id = this.generateId();
    task.id = id;
    task.creationDate = new Date().toISOString().split('T')[0];
    task.createdBy = this.currentUser.name;
    task.status = 'To Do';
    this.tasks.push(task);
    this.saveData();
    this.logActivity(`Added task ${task.jiraId}`, '✓');
    return task;
  },

  deleteIntake(intakeId) {
    this.intakes = this.intakes.filter(i => i.id !== intakeId);
    this.saveData();
  },

  deleteStory(storyId) {
    this.stories = this.stories.filter(s => s.id !== storyId);
    this.saveData();
  },

  deleteEpic(epicId) {
    this.epics = this.epics.filter(e => e.id !== epicId);
    this.saveData();
  },

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveData();
  },

  generateId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  },

  logActivity(message, icon) {
    const activities = JSON.parse(localStorage.getItem('pub_activities') || '[]');
    activities.unshift({
      message,
      icon,
      timestamp: new Date().toISOString(),
      user: this.currentUser.name
    });
    // Keep only last 20 activities
    if (activities.length > 20) {
      activities.pop();
    }
    localStorage.setItem('pub_activities', JSON.stringify(activities));
  },

  updateDashboard() {
    document.getElementById('openDefectsCount').textContent = this.defects.length;
    document.getElementById('openCRCount').textContent = this.changeRequests.length;
    document.getElementById('resolvedCount').textContent = this.resolvedItems.length;
    
    const highPriority = [
      ...this.defects.filter(d => d.priority === 'Critical' || d.priority === 'High'),
      ...this.changeRequests.filter(c => c.priority === 'Critical' || c.priority === 'High')
    ].length;
    
    document.getElementById('highPriorityCount').textContent = highPriority;
    document.getElementById('defectBadge').textContent = this.defects.length;
    document.getElementById('crBadge').textContent = this.changeRequests.length;
    document.getElementById('resolvedBadge').textContent = this.resolvedItems.length;
    document.getElementById('intakeBadge').textContent = this.intakes.length;
    document.getElementById('storyBadge').textContent = this.stories.length;
    document.getElementById('epicBadge').textContent = this.epics.length;
    document.getElementById('taskBadge').textContent = this.tasks.length;
  }
};

// User Interface Management
const UIManager = {
  init() {
    this.setupEventListeners();
    this.updateUserProfile();
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

    // Close menus on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeUserMenu();
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
      document.getElementById('userMenuEmail').textContent = user.email || 'No email';
      document.getElementById('userMenuManager').textContent = `Manager: ${user.manager || 'Not Assigned'}`;
    }
  },

  closeUserMenu() {
    closeUserMenu();
  },

  filterDefects() {
    const idSearch = document.getElementById('defectSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('defectSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('defectStatusFilter')?.value || '';
    const sortDropdownElement = document.getElementById('defectSortJira');
    const sortOrderValue = sortDropdownElement?.value || 'desc';

    console.log('=== filterDefects START ===');
    console.log('sortOrderValue:', sortOrderValue);
    console.log('Total defects:', AppState.defects.length);

    let filtered = AppState.defects.filter(d => {
      const matchesId = d.id.toLowerCase().includes(idSearch);
      const matchesJira = d.jiraId.toLowerCase().includes(jiraSearch);
      const matchesStatus = !statusFilter || d.status === statusFilter;
      return matchesId && matchesJira && matchesStatus;
    });

    console.log('Filtered defects:', filtered.map(d => ({ jiraId: d.jiraId, title: d.title })));

    // Sort by JIRA ticket number
    if (sortOrderValue === 'asc') {
      // Ascending: lowest to highest (100, 200, 300)
      filtered.sort((a, b) => {
        const numA = this.extractJiraNumber(a.jiraId);
        const numB = this.extractJiraNumber(b.jiraId);
        return numA - numB;
      });
      console.log('Sorted ASCENDING (lowest to highest)');
    } else {
      // Descending: highest to lowest (300, 200, 100) [DEFAULT]
      filtered.sort((a, b) => {
        const numA = this.extractJiraNumber(a.jiraId);
        const numB = this.extractJiraNumber(b.jiraId);
        return numB - numA;
      });
      console.log('Sorted DESCENDING (highest to lowest) [DEFAULT]');
    }

    console.log('Final sorted order:', filtered.map(d => d.jiraId));
    console.log('=== filterDefects END ===');
    
    this.renderDefects(filtered);
  },

  filterCRs() {
    const idSearch = document.getElementById('crSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('crSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('crStatusFilter')?.value || '';
    const sortDropdownElement = document.getElementById('crSortJira');
    const sortOrderValue = sortDropdownElement?.value || 'desc';

    console.log('=== filterCRs START ===');
    console.log('sortOrderValue:', sortOrderValue);
    console.log('Total CRs:', AppState.changeRequests.length);

    let filtered = AppState.changeRequests.filter(c => {
      const matchesId = c.id.toLowerCase().includes(idSearch);
      const matchesJira = c.jiraId.toLowerCase().includes(jiraSearch);
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesId && matchesJira && matchesStatus;
    });

    console.log('Filtered CRs:', filtered.map(c => ({ jiraId: c.jiraId, title: c.title })));

    // Sort by JIRA ticket number
    if (sortOrderValue === 'asc') {
      // Ascending: lowest to highest (100, 200, 300)
      filtered.sort((a, b) => {
        const numA = this.extractJiraNumber(a.jiraId);
        const numB = this.extractJiraNumber(b.jiraId);
        return numA - numB;
      });
      console.log('Sorted ASCENDING (lowest to highest)');
    } else {
      // Descending: highest to lowest (300, 200, 100) [DEFAULT]
      filtered.sort((a, b) => {
        const numA = this.extractJiraNumber(a.jiraId);
        const numB = this.extractJiraNumber(b.jiraId);
        return numB - numA;
      });
      console.log('Sorted DESCENDING (highest to lowest) [DEFAULT]');
    }

    console.log('Final sorted order:', filtered.map(c => c.jiraId));
    console.log('=== filterCRs END ===');
    
    this.renderCRs(filtered);
  },

  filterIntakes() {
    const idSearch = document.getElementById('intakeSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('intakeSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('intakeStatusFilter')?.value || '';

    let filtered = AppState.intakes.filter(i => {
      const matchesId = i.id.toLowerCase().includes(idSearch);
      const matchesJira = i.jiraId.toLowerCase().includes(jiraSearch);
      const matchesStatus = !statusFilter || i.status === statusFilter;
      return matchesId && matchesJira && matchesStatus;
    });

    this.renderIntakes(filtered);
  },

  filterStories() {
    const idSearch = document.getElementById('storySearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('storySearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('storyStatusFilter')?.value || '';

    let filtered = AppState.stories.filter(s => {
      const matchesId = s.id.toLowerCase().includes(idSearch);
      const matchesJira = s.jiraId.toLowerCase().includes(jiraSearch);
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesId && matchesJira && matchesStatus;
    });

    this.renderStories(filtered);
  },

  filterEpics() {
    const idSearch = document.getElementById('epicSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('epicSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('epicStatusFilter')?.value || '';

    let filtered = AppState.epics.filter(e => {
      const matchesId = e.id.toLowerCase().includes(idSearch);
      const matchesJira = e.jiraId.toLowerCase().includes(jiraSearch);
      const matchesStatus = !statusFilter || e.status === statusFilter;
      return matchesId && matchesJira && matchesStatus;
    });

    this.renderEpics(filtered);
  },

  filterTasks() {
    const idSearch = document.getElementById('taskSearchId')?.value.toLowerCase() || '';
    const jiraSearch = document.getElementById('taskSearchJira')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('taskStatusFilter')?.value || '';

    let filtered = AppState.tasks.filter(t => {
      const matchesId = t.id.toLowerCase().includes(idSearch);
      const matchesJira = t.jiraId.toLowerCase().includes(jiraSearch);
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesId && matchesJira && matchesStatus;
    });

    this.renderTasks(filtered);
  },

  extractJiraNumber(jiraId) {
    // Extract numeric part from JIRA ID (e.g., "PROJ-123" -> 123)
    const match = jiraId.match(/\d+/);
    const result = match ? parseInt(match[0], 10) : 0;
    // console.log(`extractJiraNumber('${jiraId}') = ${result}`);
    return result;
  },

  renderDefects(defects) {
    const container = document.getElementById('defectsList');
    
    if (defects.length === 0) {
      container.innerHTML = '<p class="empty-state">No defects match your search. Create your first defect to get started.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, defects, (defect) => this.createDefectCard(defect));
  },

  renderCRs(crs) {
    const container = document.getElementById('crsList');
    
    if (crs.length === 0) {
      container.innerHTML = '<p class="empty-state">No change requests match your search. Create your first CR to get started.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, crs, (cr) => this.createCRCard(cr));
  },

  renderIntakes(intakes) {
    const container = document.getElementById('intakesList');
    
    if (intakes.length === 0) {
      container.innerHTML = '<p class="empty-state">No intakes match your search. Create your first intake to get started.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, intakes, (intake) => this.createItemCard(intake, 'intake'));
  },

  renderStories(stories) {
    const container = document.getElementById('storiesList');
    
    if (stories.length === 0) {
      container.innerHTML = '<p class="empty-state">No stories match your search. Create your first story to get started.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, stories, (story) => this.createItemCard(story, 'story'));
  },

  renderEpics(epics) {
    const container = document.getElementById('epicsList');
    
    if (epics.length === 0) {
      container.innerHTML = '<p class="empty-state">No epics match your search. Create your first epic to get started.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, epics, (epic) => this.createItemCard(epic, 'epic'));
  },

  renderTasks(tasks) {
    const container = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
      container.innerHTML = '<p class="empty-state">No tasks match your search. Create your first task to get started.</p>';
      return;
    }

    this.renderItemsWithAppSeparation(container, tasks, (task) => this.createItemCard(task, 'task'));
  },

  renderItemsWithAppSeparation(container, items, cardRenderer) {
    // Separate items by application
    const pubItems = items.filter(item => !item.application || item.application === 'PUB');
    const edcaItems = items.filter(item => item.application === 'EDCA');

    let html = '';

    // Add filter buttons
    html += `
      <div class="app-filter-buttons">
        <button class="app-filter-btn active" onclick="AppState.filterByApp(null)">All</button>
        <button class="app-filter-btn pub-filter" onclick="AppState.filterByApp('PUB')">📋 PUB (${pubItems.length})</button>
        ${edcaItems.length > 0 ? `<button class="app-filter-btn edca-filter" onclick="AppState.filterByApp('EDCA')">🌐 EDCA (${edcaItems.length})</button>` : ''}
      </div>
    `;

    // Add PUB items
    if (pubItems.length > 0) {
      html += pubItems.map(item => cardRenderer(item)).join('');
    }

    // Add EDCA section if there are EDCA items
    if (edcaItems.length > 0) {
      html += `
        <div class="app-section-divider">
          <div class="app-section-title">
            <span class="app-icon">🌐</span>
            <span>EDCA Applications</span>
          </div>
        </div>
      `;
      html += edcaItems.map(item => cardRenderer(item)).join('');
    }

    container.innerHTML = html;
  },

  filterByApp(app) {
    const buttons = document.querySelectorAll('.app-filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (!app) {
      buttons[0].classList.add('active');
      // Show all items - would need to reload the current section
    } else {
      const targetBtn = Array.from(buttons).find(btn => btn.textContent.includes(app));
      if (targetBtn) targetBtn.classList.add('active');
      // Filter logic would be implemented here
    }
  },

  createItemCard(item, type) {
    const icons = { intake: '📥', story: '📖', epic: '🎯', task: '✓' };
    const application = item.application || 'PUB';
    const appBadgeClass = application === 'EDCA' ? 'edca' : 'pub';

    return `
      <div class="item-card" style="cursor: pointer;" onclick="viewTicket('${item.id}', '${type}')">
        <div class="item-card-header">
          <div>
            <h3 class="item-card-title">${item.jiraId}</h3>
            <p class="item-card-subtitle">${item.title}</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm);">
            <span class="item-card-id">${item.id}</span>
            <span class="application-badge ${appBadgeClass}">${application}</span>
          </div>
        </div>
        ${item.jiraLink ? `<div style="padding: 0 var(--spacing-lg) var(--spacing-md); border-bottom: 1px solid var(--border);"><a href="${item.jiraLink}" target="_blank" rel="noopener noreferrer" class="jira-link" onclick="event.stopPropagation()">🔗 View in JIRA</a></div>` : ''}
        <div class="item-card-meta">
          <div class="meta-item">
            <span class="meta-label">Assignee</span>
            <span class="meta-value">${item.assignee || 'Unassigned'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="status-badge ${item.status.toLowerCase().replace(/[\s\/]/g, '-')}">${item.status}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="priority-badge ${item.priority ? item.priority.toLowerCase() : 'medium'}">${item.priority || 'Medium'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created By</span>
            <span class="meta-value">${item.createdBy}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created</span>
            <span class="meta-value">${item.creationDate}</span>
          </div>
          ${item.dueDate ? `<div class="meta-item">
            <span class="meta-label">Due Date</span>
            <span class="meta-value">${item.dueDate}</span>
          </div>` : ''}
        </div>
      </div>
    `;
  },

  createDefectCard(defect) {
    const application = defect.application || 'PUB';
    const appBadgeClass = application === 'EDCA' ? 'edca' : 'pub';

    return `
      <div class="item-card" style="cursor: pointer;" onclick="viewTicket('${defect.id}', 'defect')">
        <div class="item-card-header">
          <div>
            <h3 class="item-card-title">${defect.jiraId}</h3>
            <p class="item-card-subtitle">${defect.title}</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm);">
            <span class="item-card-id">${defect.id}</span>
            <span class="application-badge ${appBadgeClass}">${application}</span>
          </div>
        </div>
        ${defect.jiraLink ? `<div style="padding: 0 var(--spacing-lg) var(--spacing-md); border-bottom: 1px solid var(--border);"><a href="${defect.jiraLink}" target="_blank" rel="noopener noreferrer" class="jira-link" onclick="event.stopPropagation()">🔗 View in JIRA</a></div>` : ''}
        <div class="item-card-meta">
          <div class="meta-item">
            <span class="meta-label">Assignee</span>
            <span class="meta-value">${defect.assignee || 'Unassigned'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="status-badge ${defect.status.toLowerCase().replace(/[\s\/]/g, '-')}">${defect.status}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="priority-badge ${defect.priority.toLowerCase()}">${defect.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created By</span>
            <span class="meta-value">${defect.createdBy}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created</span>
            <span class="meta-value">${defect.creationDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Due Date</span>
            <span class="meta-value">${defect.dueDate || 'N/A'}</span>
          </div>
        </div>
      </div>
    `;
  },

  createCRCard(cr) {
    const application = cr.application || 'PUB';
    const appBadgeClass = application === 'EDCA' ? 'edca' : 'pub';

    return `
      <div class="item-card" style="cursor: pointer;" onclick="viewTicket('${cr.id}', 'cr')">
        <div class="item-card-header">
          <div>
            <h3 class="item-card-title">${cr.jiraId}</h3>
            <p class="item-card-subtitle">${cr.title}</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm);">
            <span class="item-card-id">${cr.id}</span>
            <span class="application-badge ${appBadgeClass}">${application}</span>
          </div>
        </div>
        ${cr.jiraLink ? `<div style="padding: 0 var(--spacing-lg) var(--spacing-md); border-bottom: 1px solid var(--border);"><a href="${cr.jiraLink}" target="_blank" rel="noopener noreferrer" class="jira-link" onclick="event.stopPropagation()">🔗 View in JIRA</a></div>` : ''}
        <div class="item-card-meta">
          <div class="meta-item">
            <span class="meta-label">Assignee</span>
            <span class="meta-value">${cr.assignee || 'Unassigned'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="status-badge ${cr.status.toLowerCase().replace(/[\s\/]/g, '-')}">${cr.status}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Priority</span>
            <span class="priority-badge ${cr.priority.toLowerCase()}">${cr.priority}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created By</span>
            <span class="meta-value">${cr.createdBy}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created</span>
            <span class="meta-value">${cr.creationDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Due Date</span>
            <span class="meta-value">${cr.dueDate || 'N/A'}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderResolvedItems() {
    const container = document.getElementById('resolvedList');
    
    if (AppState.resolvedItems.length === 0) {
      container.innerHTML = '<p class="empty-state">No resolved items yet.</p>';
      return;
    }

    container.innerHTML = AppState.resolvedItems.map(item => this.createResolvedItemCard(item)).join('');
  },

  createResolvedItemCard(item) {
    const icon = item.type === 'defect' ? '🐛' : '📝';
    const typeLabel = item.type === 'defect' ? 'Defect' : 'Change Request';
    const application = item.application || 'PUB';
    const appBadgeClass = application === 'EDCA' ? 'edca' : 'pub';
    
    return `
      <div class="item-card" style="cursor: pointer;" onclick="openTicketModal(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${item.type}')">
        <div class="item-card-header">
          <div>
            <h3 class="item-card-title">${icon} ${item.jiraId}</h3>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-sm);">
            <span class="item-card-id">${item.id}</span>
            <span class="application-badge ${appBadgeClass}">${application}</span>
          </div>
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
            <span class="priority-badge ${item.priority.toLowerCase()}">${item.priority}</span>
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
  },

  renderActivityFeed() {
    const allActivities = JSON.parse(localStorage.getItem('pub_activities') || '[]');
    const container = document.getElementById('activityList');
    
    if (allActivities.length === 0) {
      container.innerHTML = '<p class="empty-state">No recent activity yet</p>';
      return;
    }

    // Limit to last 10 activities
    const activities = allActivities.slice(-10);

    container.innerHTML = activities.map(activity => {
      const date = new Date(activity.timestamp);
      const timeString = date.toLocaleTimeString();
      return `
        <div class="activity-item">
          <div class="activity-icon">${activity.icon}</div>
          <div class="activity-content">
            <div class="activity-title">${activity.message}</div>
            <div class="activity-time">${timeString}</div>
          </div>
        </div>
      `;
    }).join('');
  }
};

// Global Functions
function showSection(sectionName, event) {
  if (event) {
    event.preventDefault();
  }

  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  // Remove active class from nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show selected section
  const sectionId = `${sectionName}-section`;
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
  }

  // Add active class to nav item
  event.target.closest('.nav-item')?.classList.add('active');

  // Render specific content
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
  } else if (sectionName === 'resolved') {
    UIManager.renderResolvedItems();
  } else if (sectionName === 'dashboard') {
    UIManager.renderActivityFeed();
    AppState.updateDashboard();
  } else if (sectionName === 'myProfile') {
    loadMyProfile();
  } else if (sectionName === 'editProfile') {
    loadEditProfile();
  } else if (sectionName === 'myRoles') {
    loadMyRoles();
  }
}

function navigateToPage(page) {
  window.location.href = page;
}

function loadMyProfile() {
  const user = AppState.currentUser;
  if (!user) {
    document.getElementById('displayProfileManager').textContent = '-';
    document.getElementById('displayProfileName').textContent = '-';
    document.getElementById('displayProfileEmail').textContent = '-';
    document.getElementById('displayProfileDepartment').textContent = '-';
    document.getElementById('displayProfileMemberSince').textContent = '-';
    document.getElementById('displayProfileRoles').textContent = '-';
    return;
  }
  
  document.getElementById('displayProfileManager').textContent = user.manager || '-';
  document.getElementById('displayProfileName').textContent = user.name || '-';
  document.getElementById('displayProfileEmail').textContent = user.email || '-';
  document.getElementById('displayProfileDepartment').textContent = user.department || '-';
  document.getElementById('displayProfileMemberSince').textContent = user.createdAt || '-';
  document.getElementById('displayProfileRoles').textContent = (user.roles && user.roles.length > 0) ? user.roles.join(', ') : 'None Assigned';
}

function loadEditProfile() {
  const user = AppState.currentUser;
  if (!user) {
    alert('No user data available');
    return;
  }
  
  document.getElementById('editProfileManager').value = user.manager || '';
  document.getElementById('editProfileName').value = user.name || '';
  document.getElementById('editProfileEmail').value = user.email || '';
  document.getElementById('editProfileDepartment').value = user.department || '';
}

function saveProfileChanges() {
  const user = AppState.currentUser;
  const newManager = document.getElementById('editProfileManager').value.trim();
  const newName = document.getElementById('editProfileName').value.trim();
  const newEmail = document.getElementById('editProfileEmail').value.trim();
  const newDepartment = document.getElementById('editProfileDepartment').value.trim();
  
  if (!newName || !newEmail) {
    alert('Name and Email are required');
    return;
  }
  
  user.manager = newManager;
  user.name = newName;
  user.email = newEmail;
  user.department = newDepartment;
  
  sessionStorage.setItem('loggedInUser', JSON.stringify(user));
  
  // Update header display
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userMenuAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('userMenuEmail').textContent = user.email;
  document.getElementById('userMenuManager').textContent = `Manager: ${user.manager || 'Not Assigned'}`;
  
  alert('Profile updated successfully!');
}

function resetProfileForm() {
  loadEditProfile();
}

function loadMyRoles() {
  const user = AppState.currentUser;
  const roles = (user && user.roles) ? user.roles : [];
  
  const rolesList = document.getElementById('displayRolesList');
  
  if (roles.length === 0) {
    rolesList.innerHTML = '<p class="empty-state">No roles assigned</p>';
  } else {
    rolesList.innerHTML = roles.map(role => `<div class="role-badge">${role}</div>`).join('');
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  const overlay = document.getElementById('userMenuOverlay');
  
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
}

function closeUserMenu() {
  const menu = document.getElementById('userMenu');
  const overlay = document.getElementById('userMenuOverlay');
  
  menu.classList.remove('active');
  overlay.classList.remove('active');
}

function logout() {
  sessionStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
}

function viewProfile() {
  const user = AppState.currentUser;
  if (!user) {
    alert('No user data available');
    return;
  }
  
  document.getElementById('profileName').textContent = user.name || '-';
  document.getElementById('profileEmail').textContent = user.email || '-';
  document.getElementById('profileRoles').textContent = (user.roles && user.roles.length > 0) ? user.roles.join(', ') : 'None Assigned';
  document.getElementById('profileDepartment').textContent = user.department || '-';
  document.getElementById('profileMemberSince').textContent = user.createdAt || '-';
  
  openModal('profileModal');
  closeUserMenu();
}

function editProfile() {
  const user = AppState.currentUser;
  if (!user) {
    alert('No user data available');
    return;
  }
  
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editDepartment').value = user.department || '';
  
  openModal('editProfileModal');
  closeUserMenu();
}

function saveProfile() {
  const user = AppState.currentUser;
  user.name = document.getElementById('editName').value.trim();
  user.email = document.getElementById('editEmail').value.trim();
  user.department = document.getElementById('editDepartment').value.trim();
  
  sessionStorage.setItem('loggedInUser', JSON.stringify(user));
  
  // Update header display
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userMenuName').textContent = user.name;
  document.getElementById('userMenuEmail').textContent = user.email;
  
  alert('Profile updated successfully!');
  closeModal('editProfileModal');
}

function viewRoles() {
  const user = AppState.currentUser;
  const roles = (user && user.roles) ? user.roles : [];
  
  const rolesList = document.getElementById('rolesList');
  
  if (roles.length === 0) {
    rolesList.innerHTML = '<p>No roles assigned</p>';
  } else {
    rolesList.innerHTML = roles.map(role => `<div class="role-badge">${role}</div>`).join('');
  }
  
  openModal('rolesModal');
  closeUserMenu();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function resolveDefect(defectId) {
  if (confirm('Are you sure you want to resolve this defect?')) {
    AppState.resolveDefect(defectId);
    UIManager.filterDefects();
    AppState.updateDashboard();
    alert('Defect resolved successfully!');
  }
}

function resolveCR(crId) {
  if (confirm('Are you sure you want to resolve this change request?')) {
    AppState.resolveCR(crId);
    UIManager.filterCRs();
    AppState.updateDashboard();
    alert('Change request resolved successfully!');
  }
}

function deleteDefect(defectId) {
  if (confirm('Are you sure you want to delete this defect?')) {
    AppState.deleteDefect(defectId);
    UIManager.filterDefects();
    AppState.updateDashboard();
  }
}

function deleteCR(crId) {
  if (confirm('Are you sure you want to delete this change request?')) {
    AppState.deleteCR(crId);
    UIManager.filterCRs();
    AppState.updateDashboard();
  }
}

function deleteIntake(intakeId) {
  if (confirm('Are you sure you want to delete this intake?')) {
    AppState.deleteIntake(intakeId);
    UIManager.filterIntakes();
    AppState.updateDashboard();
  }
}

function deleteStory(storyId) {
  if (confirm('Are you sure you want to delete this story?')) {
    AppState.deleteStory(storyId);
    UIManager.filterStories();
    AppState.updateDashboard();
  }
}

function deleteEpic(epicId) {
  if (confirm('Are you sure you want to delete this epic?')) {
    AppState.deleteEpic(epicId);
    UIManager.filterEpics();
    AppState.updateDashboard();
  }
}

function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    AppState.deleteTask(taskId);
    UIManager.filterTasks();
    AppState.updateDashboard();
  }
}

function editDefect(defectId) {
  const defect = AppState.defects.find(d => d.id === defectId);
  
  if (!defect) {
    alert('Defect not found');
    return;
  }
  
  // Populate form fields
  document.getElementById('editDefectId').value = defect.id;
  document.getElementById('editDefectJiraId').value = defect.jiraId;
  document.getElementById('editDefectTitle').value = defect.title;
  document.getElementById('editDefectDescription').value = defect.description || '';
  document.getElementById('editDefectPriority').value = defect.priority;
  document.getElementById('editDefectStatus').value = defect.status || '';
  document.getElementById('editDefectAssignee').value = defect.assignee;
  document.getElementById('editDefectDueDate').value = defect.dueDate || '';
  document.getElementById('editDefectComponent').value = defect.component || '';
  document.getElementById('editDefectApplication').value = defect.application || '';
  document.getElementById('editDefectSeverity').value = defect.severity || '';
  document.getElementById('editDefectEnvironment').value = defect.environment || '';
  document.getElementById('editDefectJiraLink').value = defect.jiraLink || '';
  
  closeUserMenu();
  openModal('editDefectModal');
}

function saveDefect() {
  const defectId = document.getElementById('editDefectId').value;
  const defect = AppState.defects.find(d => d.id === defectId);
  
  if (!defect) {
    alert('Defect not found');
    return;
  }
  
  // Update defect properties
  defect.title = document.getElementById('editDefectTitle').value.trim();
  defect.description = document.getElementById('editDefectDescription').value.trim();
  defect.priority = document.getElementById('editDefectPriority').value;
  defect.status = document.getElementById('editDefectStatus').value;
  defect.assignee = document.getElementById('editDefectAssignee').value.trim();
  defect.dueDate = document.getElementById('editDefectDueDate').value;
  defect.component = document.getElementById('editDefectComponent').value.trim();
  defect.application = document.getElementById('editDefectApplication').value || 'PUB';
  defect.severity = document.getElementById('editDefectSeverity').value;
  defect.environment = document.getElementById('editDefectEnvironment').value;
  defect.jiraLink = document.getElementById('editDefectJiraLink').value.trim();
  
  // Save to localStorage
  AppState.saveData();
  
  // Refresh UI
  UIManager.filterDefects();
  AppState.updateDashboard();
  
  closeModal('editDefectModal');
  alert('Defect updated successfully!');
}

function editCR(crId) {
  const cr = AppState.changeRequests.find(c => c.id === crId);
  
  if (!cr) {
    alert('Change Request not found');
    return;
  }
  
  // Populate form fields
  document.getElementById('editCRId').value = cr.id;
  document.getElementById('editCRJiraId').value = cr.jiraId;
  document.getElementById('editCRTitle').value = cr.title;
  document.getElementById('editCRDescription').value = cr.description || '';
  document.getElementById('editCRPriority').value = cr.priority;
  document.getElementById('editCRStatus').value = cr.status || '';
  document.getElementById('editCRChangeType').value = cr.changeType || '';
  document.getElementById('editCRImpactLevel').value = cr.impactLevel || '';
  document.getElementById('editCRAssignee').value = cr.assignee;
  document.getElementById('editCRaffectedSystems').value = cr.affectedSystems || '';
  document.getElementById('editCRDueDate').value = cr.dueDate || '';
  document.getElementById('editCRRiskLevel').value = cr.riskLevel || '';
  document.getElementById('editCRApplication').value = cr.application || '';
  document.getElementById('editCRJiraLink').value = cr.jiraLink || '';
  
  closeUserMenu();
  openModal('editCRModal');
}

function saveCR() {
  const crId = document.getElementById('editCRId').value;
  const cr = AppState.changeRequests.find(c => c.id === crId);
  
  if (!cr) {
    alert('Change Request not found');
    return;
  }
  
  // Update CR properties
  cr.title = document.getElementById('editCRTitle').value.trim();
  cr.description = document.getElementById('editCRDescription').value.trim();
  cr.priority = document.getElementById('editCRPriority').value;
  cr.status = document.getElementById('editCRStatus').value;
  cr.changeType = document.getElementById('editCRChangeType').value;
  cr.impactLevel = document.getElementById('editCRImpactLevel').value;
  cr.assignee = document.getElementById('editCRAssignee').value.trim();
  cr.affectedSystems = document.getElementById('editCRaffectedSystems').value.trim();
  cr.dueDate = document.getElementById('editCRDueDate').value;
  cr.riskLevel = document.getElementById('editCRRiskLevel').value;
  cr.application = document.getElementById('editCRApplication').value || 'PUB';
  cr.jiraLink = document.getElementById('editCRJiraLink').value.trim();
  
  // Save to localStorage
  AppState.saveData();
  
  // Refresh UI
  UIManager.filterCRs();
  AppState.updateDashboard();
  
  closeModal('editCRModal');
  alert('Change Request updated successfully!');
}

function deleteResolved(itemId) {
  if (confirm('Are you sure you want to delete this resolved item?')) {
    AppState.resolvedItems = AppState.resolvedItems.filter(item => item.id !== itemId);
    AppState.saveData();
    UIManager.renderResolvedItems();
    AppState.updateDashboard();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  console.log('Toggle sidebar called, sidebar element:', sidebar);
  console.log('Current classes:', sidebar?.className);
  sidebar.classList.toggle('collapsed');
  console.log('After toggle, classes:', sidebar?.className);
  localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  console.log('Sidebar collapsed state saved:', sidebar.classList.contains('collapsed'));
}

function toggleNavSection(button) {
  const section = button.nextElementSibling;
  if (section && section.classList.contains('nav-collapsible')) {
    section.classList.toggle('nav-collapsed');
    button.classList.toggle('nav-section-collapsed');
    const toggle = button.querySelector('.section-toggle');
    if (toggle) {
      toggle.style.transform = button.classList.contains('nav-section-collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
    }
  }
}

// CSV Export Functions
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get all unique keys from all objects
  const allKeys = [...new Set(data.flatMap(obj => Object.keys(obj)))];
  
  // Create CSV header
  const header = allKeys.join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return allKeys.map(key => {
      const value = item[key] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') ? `"${escaped}"` : escaped;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [header, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

// View Ticket Functions
function viewTicket(id, type) {
  let item = null;
  
  switch(type) {
    case 'defect':
      item = AppState.defects.find(d => d.id === id);
      break;
    case 'cr':
      item = AppState.changeRequests.find(c => c.id === id);
      break;
    case 'intake':
      item = AppState.intakes.find(i => i.id === id);
      break;
    case 'story':
      item = AppState.stories.find(s => s.id === id);
      break;
    case 'epic':
      item = AppState.epics.find(e => e.id === id);
      break;
    case 'task':
      item = AppState.tasks.find(t => t.id === id);
      break;
  }
  
  if (!item) {
    alert('Item not found');
    return;
  }
  
  // Open modal instead of navigating
  openTicketModal(item, type);
}

function openTicketModal(item, type) {
  window.currentModalTicket = { item, type };
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
  const application = item.application || 'PUB';
  const appBadgeClass = application === 'EDCA' ? 'edca' : 'pub';
  
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
          <div class="ticket-view-field-label">Application</div>
          <div class="ticket-view-field-value"><span class="application-badge ${appBadgeClass}">${application}</span></div>
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

  // Description section
  if (item.description) {
    html += `
      <div class="ticket-view-section">
        <div class="ticket-view-section-title">Description</div>
        <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); border-left: 3px solid var(--primary); white-space: pre-wrap; line-height: 1.6;">${item.description}</div>
      </div>
    `;
  }

  // Type-specific fields
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

  // Action buttons
  // JIRA Link Section (make link clickable in modal)
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

  html += `
    <div class="ticket-modal-actions">
      <button class="btn btn-secondary" onclick="startModalEditMode()">✏️ Edit</button>
      <button class="btn btn-secondary resolve-btn" onclick="resolveFromModal()">✅ Resolve</button>
      <button class="btn btn-secondary" onclick="moveFromModal()">→ Move</button>
      <button class="btn btn-danger" onclick="deleteFromModal()">🗑️ Delete</button>
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
          <textarea id="editDescription" class="form-input" style="min-height: 100px;">${item.description || ''}</textarea>
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
        <div class="ticket-modal-edit-field">
          <label class="form-label">Application</label>
          <select id="editApplication" class="form-input">
            <option value="">-- Not Specified (PUB) --</option>
            <option value="PUB" ${item.application === 'PUB' ? 'selected' : ''}>PUB</option>
            <option value="EDCA" ${item.application === 'EDCA' ? 'selected' : ''}>EDCA</option>
          </select>
        </div>
      </div>
    </div>
  `;

  // Type-specific edit fields
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
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;

  const updated = { ...item };
  updated.title = document.getElementById('editTitle')?.value.trim() || updated.title;
  updated.description = document.getElementById('editDescription')?.value.trim() || updated.description;
  updated.priority = document.getElementById('editPriority')?.value || updated.priority;
  updated.status = document.getElementById('editStatus')?.value || updated.status;
  updated.assignee = document.getElementById('editAssignee')?.value.trim() || updated.assignee;
  updated.dueDate = document.getElementById('editDueDate')?.value || updated.dueDate;
  updated.jiraLink = document.getElementById('editJiraLink')?.value.trim() || updated.jiraLink;
  updated.application = document.getElementById('editApplication')?.value || 'PUB';

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

  try {
    // Update in AppState
    if (type === 'defect') {
      const index = AppState.defects.findIndex(d => d.id === item.id);
      if (index >= 0) AppState.defects[index] = updated;
      AppState.saveData();
    } else if (type === 'cr') {
      const index = AppState.changeRequests.findIndex(c => c.id === item.id);
      if (index >= 0) AppState.changeRequests[index] = updated;
      AppState.saveData();
    } else if (type === 'intake') {
      const index = AppState.intakes.findIndex(i => i.id === item.id);
      if (index >= 0) AppState.intakes[index] = updated;
      AppState.saveData();
    } else if (type === 'story') {
      const index = AppState.stories.findIndex(s => s.id === item.id);
      if (index >= 0) AppState.stories[index] = updated;
      AppState.saveData();
    } else if (type === 'epic') {
      const index = AppState.epics.findIndex(e => e.id === item.id);
      if (index >= 0) AppState.epics[index] = updated;
      AppState.saveData();
    } else if (type === 'task') {
      const index = AppState.tasks.findIndex(t => t.id === item.id);
      if (index >= 0) AppState.tasks[index] = updated;
      AppState.saveData();
    }

    // Update modal display
    window.currentModalTicket.item = updated;
    renderTicketModalContent(updated, type);
    alert('Changes saved successfully!');
  } catch (error) {
    alert('Error saving changes: ' + error.message);
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

  const userJson = sessionStorage.getItem('loggedInUser');
  const user = userJson ? JSON.parse(userJson) : null;

  item.status = 'Resolved';
  item.resolvedDate = new Date().toISOString().split('T')[0];
  item.resolvedBy = user?.name || 'Unknown';

  try {
    // Update in AppState
    if (type === 'defect') {
      AppState.resolveDefect(item.id);
    } else if (type === 'cr') {
      AppState.resolveCR(item.id);
    }

    alert('Item resolved and saved!');
    closeTicketModal();
    
    // Refresh the list
    if (type === 'defect') UIManager.filterDefects();
    else if (type === 'cr') UIManager.filterCRs();
  } catch (error) {
    alert('Error resolving item: ' + error.message);
  }
}

async function deleteFromModal() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;

  if (!confirm('Delete this item permanently?')) return;

  try {
    if (type === 'defect') {
      AppState.deleteDefect(item.id);
      UIManager.filterDefects();
    } else if (type === 'cr') {
      AppState.deleteCR(item.id);
      UIManager.filterCRs();
    } else if (type === 'intake') {
      AppState.deleteIntake(item.id);
      UIManager.filterIntakes();
    } else if (type === 'story') {
      AppState.deleteStory(item.id);
      UIManager.filterStories();
    } else if (type === 'epic') {
      AppState.deleteEpic(item.id);
      UIManager.filterEpics();
    } else if (type === 'task') {
      AppState.deleteTask(item.id);
      UIManager.filterTasks();
    }

    alert('Item deleted successfully!');
    closeTicketModal();
  } catch (error) {
    alert('Error deleting item: ' + error.message);
  }
}

function moveFromModal() {
  if (!window.currentModalTicket) return;
  const { item, type } = window.currentModalTicket;

  if (type === 'cr') {
    if (!confirm('Move this Change Request to Intake?')) return;
    AppState.moveCRToIntake(item.id);
    alert('Moved to Intake successfully!');
    UIManager.filterCRs();
    closeTicketModal();
  } else if (type === 'intake') {
    if (!confirm('Move this Intake to Change Request?')) return;
    AppState.moveIntakeToCR(item.id);
    alert('Moved to Change Request successfully!');
    UIManager.filterIntakes();
    closeTicketModal();
  } else {
    alert('This item type cannot be moved');
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  UIManager.init();

  // Restore sidebar state
  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    document.getElementById('sidebar').classList.add('collapsed');
  }
  
  // Initial render
  if (document.getElementById('defectsList')) {
    UIManager.filterDefects();
  }
  if (document.getElementById('crsList')) {
    UIManager.filterCRs();
  }
  if (document.getElementById('intakesList')) {
    UIManager.filterIntakes();
  }
  if (document.getElementById('storiesList')) {
    UIManager.filterStories();
  }
  if (document.getElementById('epicsList')) {
    UIManager.filterEpics();
  }
  if (document.getElementById('tasksList')) {
    UIManager.filterTasks();
  }
  if (document.getElementById('activityList')) {
    UIManager.renderActivityFeed();
  }

  // Debugging
  console.log('App initialized');
  console.log('Defects count:', AppState.defects.length);
  console.log('Change Requests count:', AppState.changeRequests.length);
  console.log('Defect sort dropdown value:', document.getElementById('defectSortJira')?.value);
  console.log('CR sort dropdown value:', document.getElementById('crSortJira')?.value);
  
  // Add test functions to window for debugging
  window.testDefectSort = () => {
    console.log('Testing defect sort...');
    UIManager.filterDefects();
  };
  window.testCRSort = () => {
    console.log('Testing CR sort...');
    UIManager.filterCRs();
  };
  window.testSidebarToggle = () => {
    console.log('Testing sidebar toggle...');
    toggleSidebar();
  };
  console.log('Test functions available: testDefectSort(), testCRSort(), testSidebarToggle()');
});
