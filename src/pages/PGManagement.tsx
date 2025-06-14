
import React from 'react';
import PGPageHeader from '@/components/pg/management/PGPageHeader';
import PGFilters from '@/components/pg/management/PGFilters';
import PGTabContent from '@/components/pg/management/PGTabContent';
import PGDialogManager from '@/components/pg/management/PGDialogManager';
import { usePGDialogs } from '@/hooks/usePGDialogs';
import { usePGManagement } from '@/hooks/usePGManagement';
import { usePGOperations } from '@/hooks/usePGOperations';

const PGManagement = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredPGs,
    loading,
    addPG,
    updatePG,
    deletePG
  } = usePGManagement();

  const {
    addDialogOpen,
    setAddDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    viewDialogOpen,
    setViewDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedPG,
    setSelectedPG,
    handleViewPG,
    handleEditClick,
    handleDeleteClick,
    handleAddNew
  } = usePGDialogs();

  const { onAddPG, onEditPG, onDeletePG } = usePGOperations({
    addPG,
    updatePG,
    deletePG,
    setAddDialogOpen,
    setEditDialogOpen,
    setDeleteDialogOpen,
    setSelectedPG
  });

  console.log("PGManagement: Rendering with", filteredPGs.length, "filtered PGs");

  return (
    <div className="page-container space-y-6">
      <PGPageHeader 
        onAddNew={handleAddNew}
        isProcessing={loading}
        loading={loading}
      />
      
      <div className="space-y-4">
        <div className="responsive-flex justify-between">
          <PGFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
      
      <div className="mt-6">
        <PGTabContent 
          loading={loading}
          filteredPGs={filteredPGs}
          onView={handleViewPG}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onAddNew={handleAddNew}
          showDeleteButton={true}
        />
      </div>

      <PGDialogManager
        addDialogOpen={addDialogOpen}
        setAddDialogOpen={setAddDialogOpen}
        editDialogOpen={editDialogOpen}
        setEditDialogOpen={setEditDialogOpen}
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        selectedPG={selectedPG}
        setSelectedPG={setSelectedPG}
        onAddPG={onAddPG}
        onEditPG={onEditPG}
        onDeletePG={(pgId) => onDeletePG(pgId, selectedPG)}
        onEditClick={handleEditClick}
        isProcessing={loading}
      />
    </div>
  );
};

export default PGManagement;
