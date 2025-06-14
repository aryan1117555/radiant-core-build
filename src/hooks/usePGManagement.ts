
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { PG } from '@/types';

export const usePGManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  const { 
    pgs: pgData, 
    isLoading: loading,
    refreshAllData,
    addPG,
    updatePG,
    deletePG
  } = useData();

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user && user.id) {
      console.log("PGManagement: User authenticated, ensuring data is loaded for user:", user?.email, user?.role);
      refreshAllData();
    }
  }, [user?.id, user?.role, refreshAllData]);

  // Filter PGs based on tab selection and search query
  const filteredPGs = pgData.filter(pg => {
    // Filter by tab
    if (activeTab !== "all" && pg.type !== activeTab) return false;
    
    // Filter by search
    if (searchQuery && !pg.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !pg.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    pgData,
    filteredPGs,
    loading,
    addPG,
    updatePG,
    deletePG,
    refreshAllData
  };
};
