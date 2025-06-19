import { useState, useCallback, useMemo, useRef } from 'react';
import { PG, Room, Student, User } from '@/types';
import { fetchPGs } from '@/services/pg';
import { fetchRooms } from '@/services/roomService';
import { fetchStudents } from '@/services/studentService';
import { fetchUsers } from '@/services/userService';
import { transformRoomFromDB, enhanceStudentsWithRoomInfo, populateStudentsIntoRooms } from '../utils/dataTransformUtils';
import { filterDataByUserRole } from '../utils/roleFilterUtils';
import { useOptimizedApi } from '@/services/optimizedApiService';
import { useDebouncedCallback } from '@/hooks/useDebounce';

export const useOptimizedDataLoader = (user: any) => {
  const [pgs, setPgs] = useState<PG[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<null | Error>(null);
  const lastLoadTime = useRef<number>(0);
  const loadToken = useRef<number>(0);
  const { makeRequest } = useOptimizedApi();

  // Cache minimum interval between full data loads (5 seconds)
  const MIN_LOAD_INTERVAL = 5000;

  // Memoize stable references for the setter functions
  const stableSetters = useMemo(() => ({
    setPgs,
    setRooms,
    setStudents,
    setUsers
  }), []);

  // Optimized individual data loaders
  const loadPGsOptimized = useCallback(async () => {
    try {
      const pgsData = await makeRequest<PG[]>('/api/pgs', {}, 1);
      return pgsData || await fetchPGs();
    } catch {
      return await fetchPGs();
    }
  }, [makeRequest]);

  const loadRoomsOptimized = useCallback(async () => {
    try {
      const roomsData = await makeRequest<any[]>('/api/rooms', {}, 1);
      return roomsData || await fetchRooms();
    } catch {
      return await fetchRooms();
    }
  }, [makeRequest]);

  const loadStudentsOptimized = useCallback(async () => {
    if (user?.id?.startsWith('demo-')) {
      return JSON.parse(localStorage.getItem('demo-students') || '[]');
    }
    
    try {
      const studentsData = await makeRequest<Student[]>('/api/students', {}, 2);
      return studentsData || await fetchStudents();
    } catch {
      return await fetchStudents();
    }
  }, [makeRequest, user?.id]);

  const loadUsersOptimized = useCallback(async () => {
    if (user?.role !== 'admin') return [];
    
    try {
      const usersData = await makeRequest<User[]>('/api/users', {}, 0);
      return usersData || await fetchUsers();
    } catch {
      return await fetchUsers();
    }
  }, [makeRequest, user?.role]);

  // Debounced full data load function
  const loadAllData = useDebouncedCallback(async (isRefresh = false) => {
    if (!user || !user.id) {
      console.log("OptimizedDataLoader: No user or user ID, skipping data load");
      return;
    }

    // Prevent too frequent loads
    const now = Date.now();
    if (now - lastLoadTime.current < MIN_LOAD_INTERVAL && !isRefresh) {
      console.log("OptimizedDataLoader: Load requested too soon, skipping");
      return;
    }

    const thisToken = ++loadToken.current;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    lastLoadTime.current = now;

    try {
      console.log("OptimizedDataLoader: Loading optimized data for user:", user?.email, user?.role);
      // Load data in parallel with priorities
      const [pgsData, roomsData, studentsData, usersData] = await Promise.all([
        loadPGsOptimized(),
        loadRoomsOptimized(),
        loadStudentsOptimized(),
        loadUsersOptimized()
      ]);

      // Only update state if this is the latest load
      if (loadToken.current !== thisToken) {
        console.log("OptimizedDataLoader: Outdated load, skipping state update");
        return;
      }

      // Transform and enhance data
      const transformedRooms = roomsData.map(transformRoomFromDB);
      const enhancedStudents = enhanceStudentsWithRoomInfo(studentsData, transformedRooms, pgsData);
      const roomsWithStudents = populateStudentsIntoRooms(transformedRooms, enhancedStudents);

      // Apply role-based filtering
      const { filteredPGs, filteredRooms, filteredStudents } = filterDataByUserRole(
        pgsData, 
        roomsWithStudents, 
        enhancedStudents, 
        user
      );

      // Batch state updates
      setPgs(filteredPGs);
      setRooms(filteredRooms);
      setStudents(filteredStudents);
      setUsers(usersData);
    } catch (error: any) {
      if (loadToken.current === thisToken) {
        setError(error);
        // Do not clear data arrays here to prevent flicker
      }
      console.error('OptimizedDataLoader: Error loading data:', error);
    } finally {
      if (loadToken.current === thisToken) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, 500); // 500ms debounce

  // Refresh function with cache invalidation
  const refreshAllData = useCallback(async () => {
    console.log("OptimizedDataLoader: Refreshing all data...");
    lastLoadTime.current = 0; // Reset to allow immediate load
    await loadAllData(true); // Pass isRefresh=true
    console.log("OptimizedDataLoader: All data refreshed successfully");
  }, [loadAllData]);

  return {
    pgs,
    rooms,
    students,
    users,
    isLoading,
    refreshing,
    error,
    loadAllData,
    refreshAllData,
    setPgs: stableSetters.setPgs,
    setRooms: stableSetters.setRooms,
    setStudents: stableSetters.setStudents,
    setUsers: stableSetters.setUsers
  };
};
