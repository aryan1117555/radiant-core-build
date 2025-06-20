
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { DataContextType } from './types/DataContextTypes';
import { useOptimizedDataLoader } from './hooks/useOptimizedDataLoader';
import { usePGOperations } from './hooks/usePGOperations';
import { useRoomOperations } from './hooks/useRoomOperations';
import { useStudentOperations } from './hooks/useStudentOperations';
import { usePaymentOperations } from './hooks/usePaymentOperations';
import { getRoomStatus } from './utils/dataTransformUtils';
import { useToast } from '@/hooks/use-toast';

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  console.log("DataContext: Current user:", user?.email, user?.user_metadata?.role, user?.user_metadata?.assignedPGs);

  // Use the optimized data loader hook
  const {
    pgs,
    rooms,
    students,
    users,
    isLoading,
    loadAllData,
    refreshAllData,
    setPgs,
    setRooms,
    setStudents,
    setUsers
  } = useOptimizedDataLoader(user);

  // Use unified operation hooks with proper refresh callbacks
  const pgOperations = usePGOperations(refreshAllData);
  const roomOperations = useRoomOperations(refreshAllData);
  const studentOperations = useStudentOperations(user, students, refreshAllData, loadAllData);
  const paymentOperations = usePaymentOperations(user, refreshAllData);

  // Load data when user changes - with proper error handling
  useEffect(() => {
    const loadData = async () => {
      if (!authLoading && user && user.id && typeof loadAllData === 'function') {
        console.log("DataContext: User authenticated, loading data for:", user.email);
        try {
          await loadAllData();
        } catch (error) {
          console.error("DataContext: Error loading data:", error);
          toast({
            title: 'Error',
            description: 'Failed to load data. Please refresh the page.',
            variant: 'destructive'
          });
        }
      } else if (!authLoading && !user) {
        console.log("DataContext: No authenticated user, clearing all data");
        if (typeof setPgs === 'function') setPgs([]);
        if (typeof setRooms === 'function') setRooms([]);
        if (typeof setStudents === 'function') setStudents([]);
        if (typeof setUsers === 'function') setUsers([]);
      }
    };

    loadData();
  }, [user?.id, authLoading, loadAllData, setPgs, setRooms, setStudents, setUsers, toast]);

  // Create the context value with safe fallbacks
  const value: DataContextType = {
    pgs: pgs || [],
    rooms: rooms || [],
    students: students || [],
    users: users || [],
    isLoading: isLoading || authLoading,
    ...pgOperations,
    ...roomOperations,
    ...studentOperations,
    ...paymentOperations,
    getRoomStatus,
    refreshAllData: refreshAllData || (() => Promise.resolve())
  };

  console.log("DataContext: Providing data - PGs:", (pgs || []).length, "Rooms:", (rooms || []).length, "Students:", (students || []).length, "Users:", (users || []).length, "Auth loading:", authLoading, "Data loading:", isLoading);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
