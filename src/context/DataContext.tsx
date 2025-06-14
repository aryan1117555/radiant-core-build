
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { DataContextType } from './types/DataContextTypes';
import { useDataLoader } from './hooks/useDataLoader';
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

  // Use the unified data loader hook
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
  } = useDataLoader(user);

  // Use unified operation hooks with proper refresh callbacks
  const pgOperations = usePGOperations(refreshAllData);
  const roomOperations = useRoomOperations(refreshAllData);
  const studentOperations = useStudentOperations(user, students, refreshAllData, loadAllData);
  const paymentOperations = usePaymentOperations(user, refreshAllData);

  // Load data when user changes
  useEffect(() => {
    if (!authLoading && user && user.id) {
      console.log("DataContext: User authenticated, loading data for:", user.email);
      loadAllData().catch(error => {
        console.error("DataContext: Error loading data:", error);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please refresh the page.',
          variant: 'destructive'
        });
      });
    } else if (!authLoading && !user) {
      console.log("DataContext: No authenticated user, clearing all data");
      setPgs([]);
      setRooms([]);
      setStudents([]);
      setUsers([]);
    }
  }, [user?.id, authLoading, loadAllData, setPgs, setRooms, setStudents, setUsers, toast]);

  // Create the context value
  const value: DataContextType = {
    pgs,
    rooms,
    students,
    users,
    isLoading: isLoading || authLoading,
    ...pgOperations,
    ...roomOperations,
    ...studentOperations,
    ...paymentOperations,
    getRoomStatus,
    refreshAllData
  };

  console.log("DataContext: Providing data - PGs:", pgs.length, "Rooms:", rooms.length, "Students:", students.length, "Users:", users.length, "Auth loading:", authLoading, "Data loading:", isLoading);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
