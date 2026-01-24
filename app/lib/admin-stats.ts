import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Group, Event } from './firestore';

// Helper to check if Firebase is available
const isFirebaseAvailable = () => {
  if (!db) {
    return false;
  }
  return true;
};

export interface UserStats {
  userId: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date | null;
  groupsCount: number;
  eventsCount: number;
  lastActive: Date | null;
}

export interface UsageStats {
  date: string;
  users: number;
  groups: number;
  events: number;
}

/**
 * Get all users from Firebase Auth (via Firestore user documents and groups)
 * Note: This requires admin access to read all user documents
 * Uses collection group queries to find users who have groups, even if no user document exists
 */
export async function getAllUsers(): Promise<UserStats[]> {
  if (!isFirebaseAvailable()) {
    return [];
  }

  try {
    const usersMap = new Map<string, UserStats>();
    
    // First, get users from users collection (if they exist)
    try {
      const usersSnapshot = await getDocs(collection(db!, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        usersMap.set(userId, {
          userId,
          email: userData.email || null,
          displayName: userData.displayName || null,
          createdAt: userData.createdAt?.toDate() || null,
          groupsCount: 0,
          eventsCount: 0,
          lastActive: userData.lastActive?.toDate() || null,
        });
      }
    } catch (error) {
      console.warn('Error getting users from users collection:', error);
    }
    
    // Get groups and events for each user
    // Note: We can only get data for users who have a document in users collection
    // or users we know about from Authentication (which requires Admin SDK)
    for (const [userId, user] of usersMap.entries()) {
      try {
        // Get user's groups
        const groupsRef = collection(db!, 'users', userId, 'groups');
        const groupsSnapshot = await getDocs(groupsRef);
        user.groupsCount = groupsSnapshot.size;
        
        // Count events across all groups
        let eventsCount = 0;
        for (const groupDoc of groupsSnapshot.docs) {
          const eventsRef = collection(db!, 'users', userId, 'groups', groupDoc.id, 'events');
          const eventsSnapshot = await getDocs(eventsRef);
          eventsCount += eventsSnapshot.size;
        }
        user.eventsCount = eventsCount;
      } catch (e) {
        // Ignore errors for individual users
        console.warn(`Error getting data for user ${userId}:`, e);
      }
    }
    
    return Array.from(usersMap.values());
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Get all groups across all users
 * Note: This requires finding users who have groups, even if they don't have a document in users collection
 */
export async function getAllGroups(): Promise<Group[]> {
  if (!isFirebaseAvailable()) {
    return [];
  }

  try {
    const allGroups: Group[] = [];
    const userIdsSet = new Set<string>();
    
    // First, get all users from users collection
    try {
      const usersSnapshot = await getDocs(collection(db!, 'users'));
      for (const userDoc of usersSnapshot.docs) {
        userIdsSet.add(userDoc.id);
      }
    } catch (error) {
      console.warn('Error getting users from users collection:', error);
    }
    
    // Try to get groups from known users
    for (const userId of userIdsSet) {
      try {
        const groupsRef = collection(db!, 'users', userId, 'groups');
        const groupsSnapshot = await getDocs(groupsRef);
        
        for (const groupDoc of groupsSnapshot.docs) {
          allGroups.push({
            id: groupDoc.id,
            ...groupDoc.data(),
          } as Group);
        }
      } catch (error) {
        // Ignore errors for individual users
        console.warn(`Error getting groups for user ${userId}:`, error);
      }
    }
    
    // Also try to get groups from users who might not have a document in users collection
    // by checking Authentication users (this requires Admin SDK, so we'll skip for now)
    // For now, we rely on users having at least accessed the app once
    
    return allGroups;
  } catch (error) {
    console.error('Error getting all groups:', error);
    return [];
  }
}

/**
 * Get all events across all users and groups
 * Note: This requires finding users who have groups, even if they don't have a document in users collection
 */
export async function getAllEvents(): Promise<Event[]> {
  if (!isFirebaseAvailable()) {
    return [];
  }

  try {
    const allEvents: Event[] = [];
    const userIdsSet = new Set<string>();
    
    // First, get all users from users collection
    try {
      const usersSnapshot = await getDocs(collection(db!, 'users'));
      for (const userDoc of usersSnapshot.docs) {
        userIdsSet.add(userDoc.id);
      }
    } catch (error) {
      console.warn('Error getting users from users collection:', error);
    }
    
    // Get events from known users
    for (const userId of userIdsSet) {
      try {
        const groupsRef = collection(db!, 'users', userId, 'groups');
        const groupsSnapshot = await getDocs(groupsRef);
        
        for (const groupDoc of groupsSnapshot.docs) {
          const eventsRef = collection(db!, 'users', userId, 'groups', groupDoc.id, 'events');
          const eventsSnapshot = await getDocs(eventsRef);
          
          for (const eventDoc of eventsSnapshot.docs) {
            allEvents.push({
              id: eventDoc.id,
              ...eventDoc.data(),
            } as Event);
          }
        }
      } catch (error) {
        // Ignore errors for individual users
        console.warn(`Error getting events for user ${userId}:`, error);
      }
    }
    
    return allEvents;
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
}

/**
 * Get usage statistics by period
 */
export async function getUsageStats(period: 'day' | 'hour' | 'month'): Promise<UsageStats[]> {
  if (!isFirebaseAvailable()) {
    return [];
  }

  try {
    const users = await getAllUsers();
    const groups = await getAllGroups();
    const events = await getAllEvents();
    
    const statsMap = new Map<string, { users: Set<string>; groups: number; events: number }>();
    
    // Process users
    users.forEach((user) => {
      if (!user.createdAt) return;
      
      let key = '';
      if (period === 'day') {
        key = user.createdAt.toISOString().split('T')[0];
      } else if (period === 'hour') {
        const date = new Date(user.createdAt);
        key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
      } else if (period === 'month') {
        const date = new Date(user.createdAt);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (key) {
        if (!statsMap.has(key)) {
          statsMap.set(key, { users: new Set(), groups: 0, events: 0 });
        }
        statsMap.get(key)!.users.add(user.userId);
      }
    });
    
    // Process groups (simplified - using creation time if available)
    groups.forEach((group) => {
      // Groups don't have createdAt in current schema, skip for now
      // Could be enhanced to track group creation
    });
    
    // Process events
    events.forEach((event) => {
      const eventDate = new Date(event.endDate);
      let key = '';
      if (period === 'day') {
        key = eventDate.toISOString().split('T')[0];
      } else if (period === 'hour') {
        key = `${eventDate.toISOString().split('T')[0]} ${eventDate.getHours()}:00`;
      } else if (period === 'month') {
        key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (key) {
        if (!statsMap.has(key)) {
          statsMap.set(key, { users: new Set(), groups: 0, events: 0 });
        }
        statsMap.get(key)!.events++;
      }
    });
    
    // Convert to array
    const stats: UsageStats[] = Array.from(statsMap.entries())
      .map(([date, data]) => ({
        date,
        users: data.users.size,
        groups: data.groups,
        events: data.events,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return stats;
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}

/**
 * Get statistics for a specific user
 */
export async function getUserStats(userId: string): Promise<{
  groupsCount: number;
  eventsCount: number;
  participantsCount: number;
  totalStars: number;
}> {
  if (!isFirebaseAvailable()) {
    return { groupsCount: 0, eventsCount: 0, participantsCount: 0, totalStars: 0 };
  }

  try {
    const groupsRef = collection(db!, 'users', userId, 'groups');
    const groupsSnapshot = await getDocs(groupsRef);
    const groupsCount = groupsSnapshot.size;
    
    let eventsCount = 0;
    let participantsCount = 0;
    let totalStars = 0;
    
    for (const groupDoc of groupsSnapshot.docs) {
      const groupData = groupDoc.data() as Group;
      participantsCount += groupData.participants?.length || 0;
      
      const eventsRef = collection(db!, 'users', userId, 'groups', groupDoc.id, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      eventsCount += eventsSnapshot.size;
      
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data() as Event;
        eventData.participants?.forEach((p) => {
          totalStars += p.stars || 0;
        });
      }
    }
    
    return {
      groupsCount,
      eventsCount,
      participantsCount,
      totalStars,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}
