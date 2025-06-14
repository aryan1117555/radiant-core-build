
import { PG } from '@/types';

interface UsePGOperationsProps {
  addPG: (pg: Omit<PG, 'id'>) => Promise<PG>;
  updatePG: (pg: PG) => Promise<PG>;
  deletePG: (pgId: string) => Promise<void>;
  setAddDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedPG: (pg: PG | null) => void;
}

export const usePGOperations = ({
  addPG,
  updatePG,
  deletePG,
  setAddDialogOpen,
  setEditDialogOpen,
  setDeleteDialogOpen,
  setSelectedPG
}: UsePGOperationsProps) => {
  const onAddPG = async (pg: Omit<PG, 'id'>): Promise<boolean> => {
    try {
      console.log("PGManagement: onAddPG called with:", pg);
      
      await addPG(pg);
      console.log("PGManagement: PG created successfully");
      
      setAddDialogOpen(false);
      return true;
      
    } catch (error) {
      console.error("PGManagement: Error in onAddPG:", error);
      return false;
    }
  };

  const onEditPG = async (pg: PG): Promise<boolean> => {
    try {
      console.log("PGManagement: onEditPG called with:", pg);
      
      await updatePG(pg);
      console.log("PGManagement: PG updated successfully");
      
      setEditDialogOpen(false);
      setSelectedPG(null);
      return true;
      
    } catch (error) {
      console.error("PGManagement: Error in onEditPG:", error);
      return false;
    }
  };

  const onDeletePG = async (pgId?: string, selectedPG?: PG | null): Promise<boolean> => {
    const targetPgId = pgId || selectedPG?.id;
    
    if (!targetPgId) return false;
    
    try {
      console.log("PGManagement: onDeletePG called for:", targetPgId);
      
      await deletePG(targetPgId);
      console.log("PGManagement: PG deleted successfully");
      
      setDeleteDialogOpen(false);
      setSelectedPG(null);
      return true;
      
    } catch (error) {
      console.error("PGManagement: Error in onDeletePG:", error);
      return false;
    }
  };

  return {
    onAddPG,
    onEditPG,
    onDeletePG
  };
};
