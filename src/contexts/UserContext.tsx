
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface UserContextType {
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  addUser: (name?: string) => void;
  removeUser: (id: string) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Array of colors for different users
const userColors = [
  "hsl(var(--safe))",
  "#9b87f5",
  "#7E69AB",
  "#0EA5E9",
  "#D946EF",
  "#F97316"
];

// Array of emojis for different users
const userEmojis = ["👤", "👥", "🧑", "👩", "👨", "🧔", "👱", "👸", "🦸", "🦹"];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('ghbTrackerUsers');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch (e) {
        console.error('Failed to parse users', e);
      }
    }
    
    // Create default user if none exist
    return [{
      id: uuidv4(),
      name: "User 1",
      color: userColors[0],
      emoji: userEmojis[0]
    }];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const savedCurrentUserId = localStorage.getItem('ghbTrackerCurrentUserId');
    return savedCurrentUserId || users[0]?.id;
  });

  // Save users to localStorage when they change
  useEffect(() => {
    localStorage.setItem('ghbTrackerUsers', JSON.stringify(users));
  }, [users]);

  // Save current user ID to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ghbTrackerCurrentUserId', currentUserId);
  }, [currentUserId]);

  const currentUser = users.find(user => user.id === currentUserId) || users[0];

  const setCurrentUser = (user: User) => {
    setCurrentUserId(user.id);
  };

  const addUser = (name?: string) => {
    const newUser: User = {
      id: uuidv4(),
      name: name || `User ${users.length + 1}`,
      color: userColors[users.length % userColors.length],
      emoji: userEmojis[users.length % userEmojis.length]
    };
    
    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
  };

  const removeUser = (id: string) => {
    if (users.length <= 1) {
      // Don't remove the last user
      return;
    }
    
    setUsers(prev => prev.filter(user => user.id !== id));
    
    // If we're removing the current user, switch to another user
    if (id === currentUserId) {
      const remainingUsers = users.filter(user => user.id !== id);
      setCurrentUserId(remainingUsers[0].id);
    }
  };

  const updateUser = (id: string, updates: Partial<Omit<User, 'id'>>) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      )
    );
  };

  return (
    <UserContext.Provider value={{
      users,
      currentUser,
      setCurrentUser,
      addUser,
      removeUser,
      updateUser
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
