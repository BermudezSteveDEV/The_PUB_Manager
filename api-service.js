/* ==========================================
   API SERVICE FOR FIREBASE AUTH + FIRESTORE
   Spark-compatible browser-side data access
   ========================================== */

(function initializeFirebaseAPI() {
  if (!window.firebase || !window.firebase.apps || !window.firebase.apps.length) {
    throw new Error(
      'Firebase is not initialized. Deploy this app on Firebase Hosting or load Firebase config before api-service.js.'
    );
  }

  const firebaseApp = window.firebase.app();
  const auth = window.firebase.auth();
  const db = window.firebase.firestore(firebaseApp);
  const { FieldValue, Timestamp } = window.firebase.firestore;

  const COLLECTIONS = {
    users: 'users',
    defects: 'defects',
    changeRequests: 'changeRequests',
    resolved: 'resolved',
    intakes: 'intakes',
    stories: 'stories',
    epics: 'epics',
    tasks: 'tasks',
    activities: 'activities',
    calendarEvents: 'calendarEvents',
    rtoRecords: 'rtoRecords'
  };

  function normalizeData(value) {
    if (value instanceof Timestamp) {
      return value.toDate().toISOString();
    }

    if (Array.isArray(value)) {
      return value.map(normalizeData);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, normalizeData(nestedValue)])
      );
    }

    return value;
  }

  function mapDoc(doc) {
    return {
      ...normalizeData(doc.data()),
      id: doc.id
    };
  }

  function collection(name) {
    return db.collection(name);
  }

  function currentDateString() {
    return new Date().toISOString().split('T')[0];
  }

  function authErrorMessage(error) {
    const code = error?.code || '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-login-credentials':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/requires-recent-login':
        return 'Please sign out and sign back in before changing your email address';
      default:
        return error?.message || 'Firebase request failed';
    }
  }

  function waitForAuthReady() {
    return new Promise(resolve => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  async function ensureSignedIn() {
    const user = auth.currentUser || await waitForAuthReady();
    if (!user) {
      throw new Error('Please sign in to continue');
    }
    return user;
  }

  async function getUserDocOrThrow(uid) {
    const userDoc = await collection(COLLECTIONS.users).doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('User profile not found. Please contact the app owner.');
    }
    return mapDoc(userDoc);
  }

  const TICKET_COLLECTIONS = ['defects', 'changeRequests', 'intakes', 'stories', 'epics', 'tasks', 'resolved'];

  function normalizeJiraId(jiraId) {
    return String(jiraId || '').trim().toUpperCase();
  }

  function duplicateJiraError(jiraId) {
    const error = new Error(`Jira ticket ${jiraId} already exists. A Jira ticket number can only be used once.`);
    error.code = 'duplicate-jira';
    return error;
  }

  async function addRecord(collectionName, payload, defaults = {}, source = null) {
    await ensureSignedIn();
    const jiraId = normalizeJiraId(payload.jiraId);
    if (!jiraId) throw new Error('Jira ticket number is required');
    const snapshots = await Promise.all(TICKET_COLLECTIONS.map(name => collection(name).get()));
    for (const [index, snapshot] of snapshots.entries()) {
      if (snapshot.docs.some(doc => normalizeJiraId(doc.data().jiraId) === jiraId &&
        !(source && source.collectionName === TICKET_COLLECTIONS[index] && source.id === doc.id))) {
        throw duplicateJiraError(jiraId);
      }
    }
    const { id: storedId, ...recordData } = payload;
    const record = {
      ...defaults,
      ...recordData,
      jiraId,
      createdAt: FieldValue.serverTimestamp()
    };
    const documentId = `jira-${encodeURIComponent(jiraId)}`;
    const docRef = collection(collectionName).doc(documentId);
    const sourceRef = source ? collection(source.collectionName).doc(source.id) : null;
    await db.runTransaction(async transaction => {
      const tickets = await Promise.all(TICKET_COLLECTIONS.map(name => transaction.get(collection(name).doc(documentId))));
      if (tickets.some(doc => doc.exists && (!sourceRef || doc.ref.path !== sourceRef.path))) {
        throw duplicateJiraError(jiraId);
      }
      if (sourceRef) {
        const sourceDoc = await transaction.get(sourceRef);
        if (!sourceDoc.exists || normalizeJiraId(sourceDoc.data().jiraId) !== jiraId) {
          throw new Error('The source Jira ticket no longer exists. Please refresh the page.');
        }
      }
      transaction.set(docRef, record);
      if (sourceRef && sourceRef.path !== docRef.path) transaction.delete(sourceRef);
    });
    const createdDoc = await docRef.get();
    return mapDoc(createdDoc);
  }

  async function updateRecord(collectionName, id, payload) {
    await ensureSignedIn();
    const existingDoc = await collection(collectionName).doc(id).get();
    if (!existingDoc.exists) throw new Error('Jira ticket not found');
    const jiraId = normalizeJiraId(existingDoc.data().jiraId);
    if (payload.jiraId !== undefined && normalizeJiraId(payload.jiraId) !== jiraId) {
      throw new Error('The Jira ticket number cannot be changed after creation');
    }
    await collection(collectionName).doc(id).update({
      ...payload,
      jiraId,
      updatedAt: FieldValue.serverTimestamp()
    });

    const updatedDoc = await collection(collectionName).doc(id).get();
    return mapDoc(updatedDoc);
  }

  async function deleteRecord(collectionName, id) {
    await ensureSignedIn();
    await collection(collectionName).doc(id).delete();
    return { success: true, id };
  }

  class FirestoreAPI {
    uniqueTickets(tickets) {
      const unique = new Map();
      for (const ticket of tickets) {
        const jiraId = normalizeJiraId(ticket.jiraId);
        const identity = jiraId ? `jira:${jiraId}` : ticket.id ? `id:${ticket.id}` : ticket;
        const key = jiraId ? identity : typeof identity === 'string' ? `${ticket.type || ticket.itemType || ''}:${identity}` : identity;
        const existing = unique.get(key);
        const modifiedAt = Date.parse(ticket.updatedAt || ticket.resolvedAt || ticket.createdAt || '') || 0;
        const existingModifiedAt = existing
          ? Date.parse(existing.updatedAt || existing.resolvedAt || existing.createdAt || '') || 0
          : 0;
        if (!existing || modifiedAt > existingModifiedAt) unique.set(key, ticket);
      }
      return [...unique.values()];
    }

    async getCurrentUserSession() {
      const user = auth.currentUser || await waitForAuthReady();
      if (!user) {
        return null;
      }

      const profile = await getUserDocOrThrow(user.uid);
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        roles: profile.roles || [],
        manager: profile.manager || null,
        department: profile.department || 'N/A',
        createdAt: profile.createdAt || null,
        rtoTracking: profile.rtoTracking || {}
      };
    }

    async login(email, password) {
      try {
        const credential = await auth.signInWithEmailAndPassword(email, password);
        const user = await getUserDocOrThrow(credential.user.uid);
        return {
          success: true,
          user
        };
      } catch (error) {
        throw new Error(authErrorMessage(error));
      }
    }

    async register(name, email, password, manager = null, roles = []) {
      try {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = credential.user.uid;

        await collection(COLLECTIONS.users).doc(uid).set({
          name,
          email,
          manager,
          roles,
          department: 'N/A',
          createdAt: FieldValue.serverTimestamp()
        });

        await credential.user.updateProfile({ displayName: name });
        await auth.signOut();

        return {
          success: true,
          user: {
            id: uid,
            name,
            email,
            manager,
            roles,
            department: 'N/A'
          }
        };
      } catch (error) {
        throw new Error(authErrorMessage(error));
      }
    }

    async signOut() {
      await auth.signOut();
      return { success: true };
    }

    async getUser(userId) {
      await ensureSignedIn();
      return getUserDocOrThrow(userId);
    }

    async updateUser(userId, userData) {
      const signedInUser = await ensureSignedIn();

      try {
        if (userData.email && signedInUser.uid === userId && userData.email !== signedInUser.email) {
          await signedInUser.updateEmail(userData.email);
        }

        await collection(COLLECTIONS.users).doc(userId).set({
          ...userData,
          roles: Array.isArray(userData.roles)
            ? userData.roles
            : String(userData.roles || '')
              .split(',')
              .map(item => item.trim())
              .filter(Boolean),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        const updatedUser = await collection(COLLECTIONS.users).doc(userId).get();
        return mapDoc(updatedUser);
      } catch (error) {
        throw new Error(authErrorMessage(error));
      }
    }

    async getDefects() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.defects).get();
      return this.uniqueTickets(snapshot.docs.map(mapDoc));
    }

    async addDefect(defect) {
      return addRecord(COLLECTIONS.defects, defect, {
        creationDate: currentDateString(),
        status: 'Open'
      });
    }

    async updateDefect(id, defect) {
      return updateRecord(COLLECTIONS.defects, id, defect);
    }

    async deleteDefect(id) {
      return deleteRecord(COLLECTIONS.defects, id);
    }

    async getChangeRequests() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.changeRequests).get();
      return this.uniqueTickets(snapshot.docs.map(mapDoc));
    }

    async addChangeRequest(cr) {
      return addRecord(COLLECTIONS.changeRequests, cr, {
        creationDate: currentDateString(),
        status: 'Open'
      });
    }

    async updateChangeRequest(id, cr) {
      return updateRecord(COLLECTIONS.changeRequests, id, cr);
    }

    async deleteChangeRequest(id) {
      return deleteRecord(COLLECTIONS.changeRequests, id);
    }

    async getIntakes() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.intakes).get();
      return this.uniqueTickets(snapshot.docs.map(mapDoc));
    }

    async addIntake(intake) {
      return addRecord(COLLECTIONS.intakes, intake, {
        creationDate: currentDateString(),
        status: 'Not Started'
      });
    }

    async updateIntake(id, intake) {
      return updateRecord(COLLECTIONS.intakes, id, intake);
    }

    async deleteIntake(id) {
      return deleteRecord(COLLECTIONS.intakes, id);
    }

    async moveCRToIntake(crId) {
      await ensureSignedIn();
      const cr = await collection(COLLECTIONS.changeRequests).doc(crId).get();
      if (!cr.exists) {
        throw new Error('Change Request not found');
      }
      
      const crData = mapDoc(cr);
      const intake = {
        ...crData,
        intakeType: crData.changeType || '',
        businessCase: crData.affectedSystems || '',
        requestedBy: crData.createdBy,
        startDate: crData.creationDate,
        status: 'Not Started',
        createdAt: FieldValue.serverTimestamp()
      };
      
      return addRecord(COLLECTIONS.intakes, intake, {}, { collectionName: COLLECTIONS.changeRequests, id: crId });
    }

    async moveIntakeToCR(intakeId) {
      await ensureSignedIn();
      const intake = await collection(COLLECTIONS.intakes).doc(intakeId).get();
      if (!intake.exists) {
        throw new Error('Intake not found');
      }
      
      const intakeData = mapDoc(intake);
      const cr = {
        ...intakeData,
        changeType: intakeData.intakeType || '',
        impactLevel: '',
        affectedSystems: intakeData.businessCase || '',
        riskLevel: '',
        status: 'Open',
        createdAt: FieldValue.serverTimestamp()
      };
      
      return addRecord(COLLECTIONS.changeRequests, cr, {}, { collectionName: COLLECTIONS.intakes, id: intakeId });
    }

    async getStories() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.stories).get();
      return this.uniqueTickets(snapshot.docs.map(mapDoc));
    }

    async addStory(story) {
      return addRecord(COLLECTIONS.stories, story, {
        creationDate: currentDateString(),
        status: 'Not Started'
      });
    }

    async updateStory(id, story) {
      return updateRecord(COLLECTIONS.stories, id, story);
    }

    async deleteStory(id) {
      return deleteRecord(COLLECTIONS.stories, id);
    }

    async getEpics() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.epics).get();
      return this.uniqueTickets(snapshot.docs.map(mapDoc));
    }

    async addEpic(epic) {
      return addRecord(COLLECTIONS.epics, epic, {
        creationDate: currentDateString(),
        status: 'Planning'
      });
    }

    async updateEpic(id, epic) {
      return updateRecord(COLLECTIONS.epics, id, epic);
    }

    async deleteEpic(id) {
      return deleteRecord(COLLECTIONS.epics, id);
    }

    async getTasks() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.tasks).get();
      return this.uniqueTickets(snapshot.docs.map(mapDoc));
    }

    async addTask(task) {
      return addRecord(COLLECTIONS.tasks, task, {
        creationDate: currentDateString(),
        status: 'To Do'
      });
    }

    async updateTask(id, task) {
      return updateRecord(COLLECTIONS.tasks, id, task);
    }

    async deleteTask(id) {
      return deleteRecord(COLLECTIONS.tasks, id);
    }

    async getResolved() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.resolved).get();
      return this.uniqueTickets(snapshot.docs.map(doc => ({ ...mapDoc(doc), resolvedId: doc.id })));
    }

    async addResolved(item) {
      await ensureSignedIn();
      const { id: originalId, ...itemData } = item;
      const record = {
        ...itemData,
        originalId,
        resolvedAt: FieldValue.serverTimestamp()
      };
      const sourceCollections = {
        defect: COLLECTIONS.defects,
        cr: COLLECTIONS.changeRequests,
        intake: COLLECTIONS.intakes,
        story: COLLECTIONS.stories,
        epic: COLLECTIONS.epics,
        task: COLLECTIONS.tasks
      };
      const sourceCollection = sourceCollections[item.type];
      if (!sourceCollection) throw new Error('Unsupported ticket type');
      const resolved = await addRecord(COLLECTIONS.resolved, record, {}, { collectionName: sourceCollection, id: originalId });
      return { ...resolved, resolvedId: resolved.id };
    }

    async restoreResolvedItem(id) {
      await ensureSignedIn();
      const resolvedDoc = await collection(COLLECTIONS.resolved).doc(id).get();
      if (!resolvedDoc.exists) throw new Error('Resolved ticket not found');
      const { type, originalId, resolvedId, resolvedAt, resolvedBy, resolvedDate, ...ticket } = resolvedDoc.data();
      if (!['defect', 'cr'].includes(type)) {
        throw new Error('Only resolved Defects and Change Requests can be restored');
      }
      return addRecord(type === 'defect' ? COLLECTIONS.defects : COLLECTIONS.changeRequests,
        { ...ticket, status: 'Open' }, {}, { collectionName: COLLECTIONS.resolved, id });
    }

    async deleteResolved(id) {
      return deleteRecord(COLLECTIONS.resolved, id);
    }

    async getActivities() {
      await ensureSignedIn();
      const snapshot = await collection(COLLECTIONS.activities)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      return snapshot.docs.map(mapDoc);
    }

    async logActivity(message, icon, user) {
      await ensureSignedIn();
      const docRef = await collection(COLLECTIONS.activities).add({
        message,
        icon,
        user,
        timestamp: FieldValue.serverTimestamp()
      });
      const createdDoc = await docRef.get();
      return mapDoc(createdDoc);
    }

    async getRecentItems(limit = 10) {
      await ensureSignedIn();
      const collections = [
        { name: COLLECTIONS.defects, type: 'Defect', icon: '🐛' },
        { name: COLLECTIONS.changeRequests, type: 'Change Request', icon: '📝' },
        { name: COLLECTIONS.intakes, type: 'Intake', icon: '📥' },
        { name: COLLECTIONS.stories, type: 'Story', icon: '📖' },
        { name: COLLECTIONS.epics, type: 'Epic', icon: '🎯' },
        { name: COLLECTIONS.tasks, type: 'Task', icon: '✓' }
      ];

      let allItems = [];

      for (const col of collections) {
        const snapshot = await collection(col.name).get();
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          const mapped = mapDoc(doc);
          const createdAt = data.updatedAt || data.createdAt || new Date(0);
          const sortDate = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
          
          return {
            ...mapped,
            itemType: col.type,
            itemIcon: col.icon,
            sortDate: sortDate
          };
        });
        allItems = allItems.concat(items);
      }

      // Sort by creation date (descending) and return only the last 'limit' items
      allItems = this.uniqueTickets(allItems);
      allItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

      return allItems.slice(0, limit);
    }

    async health() {
      return {
        status: 'Firebase client API is running',
        timestamp: new Date().toISOString()
      };
    }

    // Calendar Event Functions
    async getCalendarEvents(userId) {
      try {
        await ensureSignedIn();
        const snapshot = await collection('calendarEvents')
          .where('userId', '==', userId)
          .get();
        return snapshot.docs.map(mapDoc).sort((a, b) => new Date(a.date) - new Date(b.date));
      } catch (error) {
        console.warn('Error fetching calendar events:', error);
        return [];
      }
    }

    async addCalendarEvent(userId, event) {
      try {
        await ensureSignedIn();
        const eventData = {
          ...event,
          userId,
          createdAt: FieldValue.serverTimestamp()
        };
        const docRef = await collection('calendarEvents').add(eventData);
        const createdDoc = await docRef.get();
        return mapDoc(createdDoc);
      } catch (error) {
        console.warn('Error adding calendar event:', error);
        return null;
      }
    }

    async updateCalendarEvent(userId, eventId, event) {
      try {
        await ensureSignedIn();
        const eventData = {
          ...event,
          userId,
          updatedAt: FieldValue.serverTimestamp()
        };
        await collection('calendarEvents').doc(eventId).set(eventData, { merge: true });
        const updatedDoc = await collection('calendarEvents').doc(eventId).get();
        return mapDoc(updatedDoc);
      } catch (error) {
        console.warn('Error updating calendar event:', error);
        return null;
      }
    }

    async deleteCalendarEvent(eventId) {
      try {
        await ensureSignedIn();
        await collection('calendarEvents').doc(eventId).delete();
        return { success: true, id: eventId };
      } catch (error) {
        console.warn('Error deleting calendar event:', error);
        return { success: false };
      }
    }

    async saveCalendarEvents(userId, events) {
      try {
        await ensureSignedIn();
        // Save events to localStorage first
        localStorage.setItem('pub_calendar_events', JSON.stringify(events));
        
        // Sync all events with Firestore
        for (const event of events) {
          if (event.firestoreId) {
            // Update existing event
            await this.updateCalendarEvent(userId, event.firestoreId, event);
          } else {
            // Add new event
            await this.addCalendarEvent(userId, event);
          }
        }
        return { success: true };
      } catch (error) {
        console.warn('Error saving calendar events:', error);
        return { success: false };
      }
    }

    async getRTORecords(userId) {
      try {
        await ensureSignedIn();

        const userDoc = await collection(COLLECTIONS.users).doc(userId).get();
        if (userDoc.exists) {
          const userData = mapDoc(userDoc);
          const storedMonths = userData.rtoTracking?.months || userData.rtoRecords || {};

          const userRecords = Object.entries(storedMonths).map(([monthKey, value]) => {
            const officeDays = typeof value === 'number'
              ? value
              : Number(value?.officeDays ?? value ?? 0);

            const arrayEntries = Array.isArray(value?.entries) ? value.entries : [];
            const mapEntries = value?.rtoDays && typeof value.rtoDays === 'object'
              ? Object.entries(value.rtoDays).map(([date, office]) => ({ date, office }))
              : [];
            const entries = arrayEntries.length > 0 ? arrayEntries : mapEntries;

            return {
              id: `${userId}_${monthKey}`,
              userId,
              monthKey,
              officeDays,
              entries: entries
                .filter(entry => entry?.date && entry?.office)
                .map(entry => ({
                  date: entry.date,
                  office: entry.office,
                  updatedAt: entry.updatedAt || null
                }))
            };
          }).filter(record => Number.isFinite(record.officeDays));

          if (userRecords.length > 0) {
            return userRecords.sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)));
          }
        }

        const snapshot = await collection(COLLECTIONS.rtoRecords)
          .where('userId', '==', userId)
          .get();

        return snapshot.docs.map(mapDoc).map(record => ({
          ...record,
          entries: Array.isArray(record.entries) ? record.entries : []
        })).sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)));
      } catch (error) {
        console.warn('Error fetching RTO records:', error);
        return [];
      }
    }

    async saveRTORecord(userId, monthKey, officeDays, details = {}) {
      try {
        await ensureSignedIn();
        const userRef = collection(COLLECTIONS.users).doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? mapDoc(userDoc) : {};
        const existingMonths = userData.rtoTracking?.months || userData.rtoRecords || {};
        const entries = Array.isArray(details.entries)
          ? details.entries
            .filter(entry => entry?.date && entry?.office)
            .map(entry => ({
              date: entry.date,
              office: entry.office,
              updatedAt: entry.updatedAt || new Date().toISOString()
            }))
          : [];
        const rtoDays = entries.reduce((accumulator, entry) => {
          accumulator[entry.date] = entry.office;
          return accumulator;
        }, {});

        const payload = {
          rtoTracking: {
            months: {
              ...existingMonths,
              [monthKey]: {
                officeDays,
                entries,
                rtoDays,
                updatedAt: FieldValue.serverTimestamp(),
                createdAt: existingMonths[monthKey]?.createdAt || FieldValue.serverTimestamp()
              }
            }
          },
          rtoUpdatedAt: FieldValue.serverTimestamp()
        };

        await userRef.set(payload, { merge: true });

        return {
          id: `${userId}_${monthKey}`,
          userId,
          monthKey,
          officeDays,
          entries
        };
      } catch (error) {
        console.warn('Error saving RTO record:', error);
        return null;
      }
    }
  }

  window.api = new FirestoreAPI();
})();
