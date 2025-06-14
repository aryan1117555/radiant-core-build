
import { PG } from '@/types';
import { addPG as addPGService, updatePG as updatePGService, deletePG as deletePGService } from '@/services/pg';
import { useToast } from '@/hooks/use-toast';

export const usePGOperations = (refreshAllData: () => Promise<void>) => {
  const { toast } = useToast();

  const handleAddPG = async (pg: Omit<PG, 'id'>): Promise<PG> => {
    try {
      console.log("DataContext PGOps: Adding PG:", pg.name);
      
      // Validate required fields
      if (!pg.name?.trim()) {
        throw new Error('PG name is required');
      }
      if (!pg.location?.trim()) {
        throw new Error('Location is required');
      }
      if (!pg.totalRooms || pg.totalRooms < 1) {
        throw new Error('Total rooms must be at least 1');
      }
      if (!pg.floors || pg.floors < 1) {
        throw new Error('Number of floors must be at least 1');
      }

      const newPG = await addPGService(pg);
      console.log("DataContext PGOps: PG added successfully:", newPG);
      
      // Refresh all data after successful creation to update UI
      await refreshAllData();
      
      toast({
        title: 'Success',
        description: `${pg.name} has been created successfully with ${pg.totalRooms} rooms.`
      });
      
      return newPG;
    } catch (error) {
      console.error("DataContext PGOps: Error adding PG:", error);
      
      let errorMessage = 'Failed to create PG. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleUpdatePG = async (pg: PG): Promise<PG> => {
    try {
      console.log("DataContext PGOps: Updating PG:", pg.name);
      
      // Validate required fields
      if (!pg.name?.trim()) {
        throw new Error('PG name is required');
      }
      if (!pg.location?.trim()) {
        throw new Error('Location is required');
      }

      const updatedPG = await updatePGService(pg.id, pg);
      console.log("DataContext PGOps: PG updated successfully:", updatedPG);
      
      // Refresh all data after successful update to update UI
      await refreshAllData();
      
      toast({
        title: 'Success',
        description: `${pg.name} has been updated successfully.`
      });
      
      return updatedPG;
    } catch (error) {
      console.error("DataContext PGOps: Error updating PG:", error);
      
      let errorMessage = 'Failed to update PG. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleDeletePG = async (pgId: string) => {
    try {
      console.log("DataContext PGOps: Deleting PG:", pgId);
      await deletePGService(pgId);
      console.log("DataContext PGOps: PG deleted successfully");
      
      // Refresh all data after successful deletion to update UI
      await refreshAllData();
      
      toast({
        title: 'Success',
        description: 'PG and all its rooms have been deleted successfully.'
      });
    } catch (error) {
      console.error("DataContext PGOps: Error deleting PG:", error);
      toast({
        title: 'Error',
        description: 'Failed to delete PG. Please try again.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    addPG: handleAddPG,
    updatePG: handleUpdatePG,
    deletePG: handleDeletePG
  };
};
