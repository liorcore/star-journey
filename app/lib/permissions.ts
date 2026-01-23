import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Event } from './firestore';

export type UserRole = 'owner' | 'guest' | 'none';

export async function getUserRole(
  userId: string,
  groupId: string,
  eventId: string
): Promise<UserRole> {
  try {
    const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return 'none';
    }

    const event = eventDoc.data() as Event;
    
    if (event.ownerId === userId) {
      return 'owner';
    }

    if (event.guests?.some((g) => g.userId === userId)) {
      return 'guest';
    }

    return 'none';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'none';
  }
}

export async function canEditEvent(
  userId: string,
  groupId: string,
  eventId: string
): Promise<boolean> {
  const role = await getUserRole(userId, groupId, eventId);
  return role === 'owner';
}

export async function canEditParticipant(
  userId: string,
  groupId: string,
  eventId: string,
  participantId: string
): Promise<boolean> {
  try {
    const role = await getUserRole(userId, groupId, eventId);
    
    if (role === 'owner') {
      return true;
    }

    if (role === 'guest') {
      const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return false;
      }

      const event = eventDoc.data() as Event;
      const participant = event.participants.find((p) => p.participantId === participantId);
      
      return participant?.addedBy === userId;
    }

    return false;
  } catch (error) {
    console.error('Error checking participant edit permission:', error);
    return false;
  }
}

export async function canManageStars(
  userId: string,
  groupId: string,
  eventId: string,
  participantId: string
): Promise<boolean> {
  try {
    const role = await getUserRole(userId, groupId, eventId);
    
    if (role === 'owner') {
      return true;
    }

    if (role === 'guest') {
      const eventRef = doc(db, 'users', userId, 'groups', groupId, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        return false;
      }

      const event = eventDoc.data() as Event;
      const participant = event.participants.find((p) => p.participantId === participantId);
      
      return participant?.addedBy === userId;
    }

    return false;
  } catch (error) {
    console.error('Error checking stars management permission:', error);
    return false;
  }
}
