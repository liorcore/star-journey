import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  runTransaction,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to check if Firebase is available
const isFirebaseAvailable = () => {
  if (!db) {
    // Demo mode - using localStorage
    return false;
  }
  return true;
};

// Types
export interface Participant {
  id: string;
  name: string;
  icon: string;
  age: number;
  color: string;
  gender: 'male' | 'female';
  totalStars: number;
  eventCount: number;
  completedEvents?: Array<{
    eventId: string;
    stars: number;
    icon: string;
    eventName: string;
    eventCompleted: boolean;
  }>;
}

export interface EventParticipant {
  participantId: string;
  stars: number;
  addedBy: string;
}

export interface Event {
  id: string;
  name: string;
  icon: string;
  endDate: number;
  starGoal: number;
  ownerId: string;
  guests?: Array<{ userId: string; addedAt: Timestamp }>;
  participants: EventParticipant[];
}

export interface Group {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  participants: Participant[];
  events?: Event[]; // Optional - events are in subcollection, loaded separately if needed
}

// Validation helpers
function validateString(value: string, maxLength: number, fieldName: string): void {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} חייב להיות מחרוזת`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} לא יכול להיות יותר מ-${maxLength} תווים`);
  }
  // Basic XSS prevention - remove script tags
  if (value.includes('<script') || value.includes('</script>')) {
    throw new Error(`${fieldName} מכיל תווים לא מורשים`);
  }
}

function validateNumber(value: number, min: number, max: number, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} חייב להיות מספר`);
  }
  if (value < min || value > max) {
    throw new Error(`${fieldName} חייב להיות בין ${min} ל-${max}`);
  }
}

// User Groups
export async function getUserGroups(userId: string): Promise<Group[]> {
  if (!db) {
    // Demo mode - return empty array or mock data from localStorage
    const stored = localStorage.getItem('demo_groups');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  
  try {
    const groupsRef = collection(db, 'users', userId, 'groups');
    const snapshot = await getDocs(groupsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Group[];
  } catch (error) {
    // Error getting user groups
    throw error;
  }
}

export async function createGroup(userId: string, groupData: Omit<Group, 'id' | 'ownerId'>): Promise<string> {
  if (!db) {
    // Demo mode - save to localStorage
    validateString(groupData.name, 100, 'שם קבוצה');
    validateString(groupData.code, 10, 'קוד קבוצה');
    
    const newGroup: Group = {
      id: 'demo-' + Date.now(),
      ...groupData,
      ownerId: userId,
    };
    
    const groups = await getUserGroups(userId);
    groups.push(newGroup);
    localStorage.setItem('demo_groups', JSON.stringify(groups));
    return newGroup.id;
  }
  
  try {
    validateString(groupData.name, 100, 'שם קבוצה');
    validateString(groupData.code, 10, 'קוד קבוצה');

    const groupsRef = collection(db, 'users', userId, 'groups');
    const newGroup = {
      ...groupData,
      ownerId: userId,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(groupsRef, newGroup);
    return docRef.id;
  } catch (error) {
    // Error creating group
    throw error;
  }
}

export async function updateGroup(
  userId: string,
  groupId: string,
  groupData: Partial<Omit<Group, 'id' | 'ownerId'>>
): Promise<void> {
  if (!isFirebaseAvailable()) {
    // Demo mode - update in localStorage
    const groups = await getUserGroups(userId);
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      throw new Error('קבוצה לא נמצאה');
    }
    groups[groupIndex] = { ...groups[groupIndex], ...groupData };
    localStorage.setItem('demo_groups', JSON.stringify(groups));
    return;
  }
  
  try {
    const groupRef = doc(db!, 'users', userId, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('קבוצה לא נמצאה');
    }

    const group = groupDoc.data() as Group;
    if (group.ownerId !== userId) {
      throw new Error('אין הרשאה לערוך קבוצה זו');
    }

    if (groupData.name) validateString(groupData.name, 100, 'שם קבוצה');
    if (groupData.code) validateString(groupData.code, 10, 'קוד קבוצה');

    await updateDoc(groupRef, {
      ...groupData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Error updating group
    throw error;
  }
}

export async function deleteParticipantFromGroup(
  userId: string,
  groupId: string,
  participantId: string
): Promise<void> {
  if (!isFirebaseAvailable()) {
    // Demo mode - update in localStorage
    const groups = await getUserGroups(userId);
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      throw new Error('קבוצה לא נמצאה');
    }
    const group = groups[groupIndex];
    const updatedParticipants = group.participants.filter(p => p.id !== participantId);
    groups[groupIndex] = { ...group, participants: updatedParticipants };
    localStorage.setItem('demo_groups', JSON.stringify(groups));
    return;
  }
  
  try {
    const groupRef = doc(db!, 'users', userId, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('קבוצה לא נמצאה');
    }

    const group = groupDoc.data() as Group;
    if (group.ownerId !== userId) {
      throw new Error('אין הרשאה לערוך קבוצה זו');
    }

    const updatedParticipants = group.participants.filter(p => p.id !== participantId);
    
    await updateDoc(groupRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Error deleting participant from group
    throw error;
  }
}

export async function deleteGroup(userId: string, groupId: string): Promise<void> {
  try {
    const groupRef = doc(db, 'users', userId, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('קבוצה לא נמצאה');
    }

    const group = groupDoc.data() as Group;
    if (group.ownerId !== userId) {
      throw new Error('אין הרשאה למחוק קבוצה זו');
    }

    await deleteDoc(groupRef);
  } catch (error) {
    // Error deleting group
    throw error;
  }
}

// Events
export async function getGroupEvents(userId: string, groupId: string): Promise<Event[]> {
  if (!isFirebaseAvailable()) {
    // Demo mode - return empty array or mock data from localStorage
    const stored = localStorage.getItem(`demo_events_${groupId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  
  try {
    const eventsRef = collection(db!, 'users', userId, 'groups', groupId, 'events');
    const snapshot = await getDocs(eventsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  } catch (error) {
    // Error getting group events
    throw error;
  }
}

export async function createEvent(
  userId: string,
  groupId: string,
  eventData: Omit<Event, 'id' | 'ownerId' | 'guests' | 'participants'>
): Promise<string> {
  if (!isFirebaseAvailable()) {
    // Demo mode - save to localStorage
    validateString(eventData.name, 100, 'שם אירוע');
    validateNumber(eventData.starGoal, 0, 1000, 'יעד כוכבים');
    validateNumber(eventData.endDate, Date.now() - 24 * 60 * 60 * 1000, Date.now() + 365 * 24 * 60 * 60 * 1000, 'תאריך סיום');
    
    const newEvent: Event = {
      id: 'demo-event-' + Date.now(),
      ...eventData,
      ownerId: userId,
      guests: [],
      participants: [],
    };
    
    const events = await getGroupEvents(userId, groupId);
    events.push(newEvent);
    const storageKey = `demo_events_${groupId}`;
    localStorage.setItem(storageKey, JSON.stringify(events));
    
    return newEvent.id;
  }
  
  try {
    validateString(eventData.name, 100, 'שם אירוע');
    validateNumber(eventData.starGoal, 0, 1000, 'יעד כוכבים');
    validateNumber(eventData.endDate, Date.now() - 24 * 60 * 60 * 1000, Date.now() + 365 * 24 * 60 * 60 * 1000, 'תאריך סיום');

    const eventsRef = collection(db!, 'users', userId, 'groups', groupId, 'events');
    const newEvent = {
      ...eventData,
      ownerId: userId,
      guests: [],
      participants: [],
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(eventsRef, newEvent);
    return docRef.id;
  } catch (error) {
    // Error creating event
    throw error;
  }
}

export async function updateEvent(
  userId: string,
  groupId: string,
  eventId: string,
  eventData: Partial<Omit<Event, 'id' | 'ownerId' | 'guests' | 'participants'>>
): Promise<void> {
  try {
    const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error('אירוע לא נמצא');
    }

    const event = eventDoc.data() as Event;
    if (event.ownerId !== userId) {
      throw new Error('אין הרשאה לערוך אירוע זה');
    }

    if (eventData.name) validateString(eventData.name, 100, 'שם אירוע');
    if (eventData.starGoal !== undefined) validateNumber(eventData.starGoal, 0, 1000, 'יעד כוכבים');
    if (eventData.endDate !== undefined) {
      validateNumber(eventData.endDate, Date.now(), Date.now() + 365 * 24 * 60 * 60 * 1000, 'תאריך סיום');
    }

    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Error updating event
    throw error;
  }
}

export async function deleteEvent(userId: string, groupId: string, eventId: string): Promise<void> {
  try {
    const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error('אירוע לא נמצא');
    }

    const event = eventDoc.data() as Event;
    if (event.ownerId !== userId) {
      throw new Error('אין הרשאה למחוק אירוע זה');
    }

    await deleteDoc(eventRef);
  } catch (error) {
    // Error deleting event
    throw error;
  }
}

// Participants
export async function addParticipantToEvent(
  userId: string,
  groupId: string,
  eventId: string,
  participantData: Participant
): Promise<void> {
  if (!isFirebaseAvailable()) {
    // Demo mode - save to localStorage
    validateString(participantData.name, 100, 'שם משתתף');
    validateNumber(participantData.age, 0, 100, 'גיל');
    validateNumber(participantData.totalStars || 0, 0, 1000, 'כוכבים');
    
    const events = await getGroupEvents(userId, groupId);
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      throw new Error('אירוע לא נמצא');
    }
    
    // Check if participant already exists
    const existingIndex = event.participants.findIndex(
      (p) => p.participantId === participantData.id
    );
    
    if (existingIndex >= 0) {
      throw new Error('המשתתף כבר באירוע');
    }
    
    // Add participant to event
    event.participants.push({
      participantId: participantData.id,
      stars: 0,
      addedBy: userId,
    });
    
    localStorage.setItem(`demo_events_${groupId}`, JSON.stringify(events));
    return;
  }
  
  try {
    validateString(participantData.name, 100, 'שם משתתף');
    validateNumber(participantData.age, 0, 100, 'גיל');
    validateNumber(participantData.totalStars || 0, 0, 1000, 'כוכבים');

    const eventRef = doc(db!, 'users', userId, 'groups', groupId, 'events', eventId);
    
    await runTransaction(db!, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('אירוע לא נמצא');
      }

      const event = eventDoc.data() as Event;
      
      // Check if user is owner or guest
      const isOwner = event.ownerId === userId;
      const isGuest = event.guests?.some((g) => g.userId === userId) || false;
      
      if (!isOwner && !isGuest) {
        throw new Error('אין הרשאה להוסיף משתתף לאירוע זה');
      }

      // Check if participant already exists
      const existingIndex = event.participants.findIndex(
        (p) => p.participantId === participantData.id
      );
      
      if (existingIndex >= 0) {
        throw new Error('המשתתף כבר באירוע');
      }

      // Add participant to event
      const updatedParticipants = [
        ...event.participants,
        {
          participantId: participantData.id,
          stars: 0,
          addedBy: userId,
        },
      ];

      transaction.update(eventRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Error adding participant to event
    throw error;
  }
}

export async function updateParticipantStars(
  userId: string,
  groupId: string,
  eventId: string,
  participantId: string,
  stars: number
): Promise<void> {
  try {
    validateNumber(stars, 0, 1000, 'כוכבים');

    const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
    
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('אירוע לא נמצא');
      }

      const event = eventDoc.data() as Event;
      const participant = event.participants.find((p) => p.participantId === participantId);
      
      if (!participant) {
        throw new Error('משתתף לא נמצא');
      }

      // Check permissions: owner can manage all, guest can only manage their own
      const isOwner = event.ownerId === userId;
      const canManage = isOwner || (participant.addedBy === userId);

      if (!canManage) {
        throw new Error('אין הרשאה לנהל כוכבים למשתתף זה');
      }

      const updatedParticipants = event.participants.map((p) =>
        p.participantId === participantId ? { ...p, stars } : p
      );

      transaction.update(eventRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Error updating participant stars
    throw error;
  }
}

// Update participant in event
export async function updateParticipant(
  userId: string,
  groupId: string,
  eventId: string,
  participantId: string,
  participantData: Partial<Participant>
): Promise<void> {
  try {
    if (participantData.name) validateString(participantData.name, 100, 'שם משתתף');
    if (participantData.age !== undefined) validateNumber(participantData.age, 0, 100, 'גיל');

    const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
    
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('אירוע לא נמצא');
      }

      const event = eventDoc.data() as Event;
      const participant = event.participants.find((p) => p.participantId === participantId);
      
      if (!participant) {
        throw new Error('משתתף לא נמצא');
      }

      // Check permissions: owner can edit all, guest can only edit their own
      const isOwner = event.ownerId === userId;
      const canEdit = isOwner || (participant.addedBy === userId);

      if (!canEdit) {
        throw new Error('אין הרשאה לערוך משתתף זה');
      }

      // Update participant in group (if name, age, etc. changed)
      const groupRef = doc(db, 'users', userId, 'groups', groupId);
      const groupDoc = await transaction.get(groupRef);
      
      if (groupDoc.exists()) {
        const group = groupDoc.data() as Group;
        const updatedGroupParticipants = group.participants.map((p) =>
          p.id === participantId ? { ...p, ...participantData } : p
        );
        transaction.update(groupRef, {
          participants: updatedGroupParticipants,
          updatedAt: serverTimestamp(),
        });
      }

      transaction.update(eventRef, {
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Error updating participant
    throw error;
  }
}

// Delete participant from event
export async function deleteParticipant(
  userId: string,
  groupId: string,
  eventId: string,
  participantId: string
): Promise<void> {
  try {
    const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
    
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('אירוע לא נמצא');
      }

      const event = eventDoc.data() as Event;
      const participant = event.participants.find((p) => p.participantId === participantId);
      
      if (!participant) {
        throw new Error('משתתף לא נמצא');
      }

      // Check permissions: owner can delete all, guest can only delete their own
      const isOwner = event.ownerId === userId;
      const canDelete = isOwner || (participant.addedBy === userId);

      if (!canDelete) {
        throw new Error('אין הרשאה למחוק משתתף זה');
      }

      // Remove participant from event
      const updatedParticipants = event.participants.filter(
        (p) => p.participantId !== participantId
      );

      transaction.update(eventRef, {
        participants: updatedParticipants,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Error deleting participant
    throw error;
  }
}

// Real-time listeners
export function subscribeToGroup(
  userId: string,
  groupId: string,
  callback: (group: Group | null) => void
): () => void {
  if (!isFirebaseAvailable()) {
    // Demo mode - load from localStorage and call callback once
    getUserGroups(userId).then(groups => {
      const group = groups.find(g => g.id === groupId) || null;
      callback(group);
    });
    return () => {}; // Return empty unsubscribe function
  }
  
  const groupRef = doc(db!, 'users', userId, 'groups', groupId);
  
  return onSnapshot(groupRef, (doc) => {
    if (doc.exists()) {
      const groupData = { id: doc.id, ...doc.data() } as Group;
      callback(groupData);
    } else {
      callback(null);
    }
  });
}

export function subscribeToEvent(
  userId: string,
  groupId: string,
  eventId: string,
  callback: (event: Event | null) => void
): () => void {
  if (!isFirebaseAvailable()) {
    // Demo mode - load from localStorage and call callback once
    getGroupEvents(userId, groupId).then(events => {
      const event = events.find(e => e.id === eventId) || null;
      callback(event);
    });
    return () => {}; // Return empty unsubscribe function
  }
  
  const eventRef = doc(db!, 'users', userId, 'groups', groupId, 'events', eventId);
  
  return onSnapshot(eventRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Event);
    } else {
      callback(null);
    }
  });
}

// Get all events for a user (owner + guest)
export async function getUserEvents(userId: string): Promise<Event[]> {
  try {
    const groups = await getUserGroups(userId);
    const allEvents: Event[] = [];

    for (const group of groups) {
      const events = await getGroupEvents(userId, group.id);
      allEvents.push(...events);
    }

    return allEvents;
  } catch (error) {
    // Error getting user events
    throw error;
  }
}

// Invite a user to an event as a guest
export async function inviteUserToEvent(
  ownerUserId: string,
  groupId: string,
  eventId: string,
  guestUserId: string
): Promise<void> {
  try {
    const eventRef = doc(db, 'users', ownerUserId, 'groups', groupId, 'events', eventId);
    
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('אירוע לא נמצא');
      }

      const event = eventDoc.data() as Event;
      
      // Only owner can invite guests
      if (event.ownerId !== ownerUserId) {
        throw new Error('אין הרשאה להזמין משתמשים לאירוע זה');
      }

      // Check if user is already a guest
      const existingGuest = event.guests?.some((g) => g.userId === guestUserId);
      if (existingGuest) {
        throw new Error('המשתמש כבר הוזמן לאירוע');
      }

      // Add guest
      const updatedGuests = [
        ...(event.guests || []),
        {
          userId: guestUserId,
          addedAt: serverTimestamp() as Timestamp,
        },
      ];

      transaction.update(eventRef, {
        guests: updatedGuests,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Error inviting user to event
    throw error;
  }
}
