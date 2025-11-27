import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PersonalizedName, PersonalizedNameType } from '@leadership-training/shared';
import { personalizedNamesService } from '../services/personalized-names.service';
import { useAuth } from './AuthContext';

interface PersonalizedNamesContextType {
  names: PersonalizedName[];
  isLoading: boolean;
  error: string | null;
  refreshNames: () => Promise<void>;
  getNameByType: (type: PersonalizedNameType) => string | null;
  addName: (name: Omit<PersonalizedName, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateName: (id: string, updates: Partial<PersonalizedName>) => Promise<void>;
  deleteName: (id: string) => Promise<void>;
}

const PersonalizedNamesContext = createContext<PersonalizedNamesContextType | undefined>(undefined);

interface PersonalizedNamesProviderProps {
  children: ReactNode;
}

export const PersonalizedNamesProvider: React.FC<PersonalizedNamesProviderProps> = ({ children }) => {
  const [names, setNames] = useState<PersonalizedName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refreshNames = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedNames = await personalizedNamesService.findAll();
      setNames(fetchedNames);
    } catch (err) {
      console.error('Failed to fetch personalized names:', err);
      setError('Failed to load personalized names');
    } finally {
      setIsLoading(false);
    }
  };

  const getNameByType = (type: PersonalizedNameType): string | null => {
    const nameEntry = names.find(name => name.type === type && name.isActive);
    return nameEntry ? nameEntry.name : null;
  };

  const addName = async (nameData: Omit<PersonalizedName, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newName = await personalizedNamesService.create(nameData as any);
      setNames(prev => [...prev, newName]);
    } catch (err) {
      console.error('Failed to add personalized name:', err);
      throw err;
    }
  };

  const updateName = async (id: string, updates: Partial<PersonalizedName>) => {
    try {
      const updatedName = await personalizedNamesService.update(id, updates);
      setNames(prev => prev.map(name => name.id === id ? updatedName : name));
    } catch (err) {
      console.error('Failed to update personalized name:', err);
      throw err;
    }
  };

  const deleteName = async (id: string) => {
    try {
      await personalizedNamesService.delete(id);
      setNames(prev => prev.filter(name => name.id !== id));
    } catch (err) {
      console.error('Failed to delete personalized name:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshNames();
  }, [isAuthenticated]);

  const value: PersonalizedNamesContextType = {
    names,
    isLoading,
    error,
    refreshNames,
    getNameByType,
    addName,
    updateName,
    deleteName,
  };

  return (
    <PersonalizedNamesContext.Provider value={value}>
      {children}
    </PersonalizedNamesContext.Provider>
  );
};

export const usePersonalizedNames = (): PersonalizedNamesContextType => {
  const context = useContext(PersonalizedNamesContext);
  if (context === undefined) {
    throw new Error('usePersonalizedNames must be used within a PersonalizedNamesProvider');
  }
  return context;
};