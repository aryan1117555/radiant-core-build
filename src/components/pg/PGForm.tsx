
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PG } from '@/types';
import { usePGFormState } from './hooks/usePGFormState';
import { usePGFormSubmit } from './hooks/usePGFormSubmit';
import PGFormFields from './PGFormFields';
import PGFormRoomAllocation from './PGFormRoomAllocation';
import PGFormActions from './PGFormActions';
import { useToast } from '@/hooks/use-toast';

interface PGFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (pg: Omit<PG, 'id'> | PG) => Promise<boolean>;
  pg?: PG;
}

const PGForm: React.FC<PGFormProps> = ({ open, onClose, onSave, pg }) => {
  const { toast } = useToast();
  const isEdit = Boolean(pg);
  
  const {
    form,
    formKey,
    managers,
    roomTypes,
    setRoomTypes,
    roomAllocations,
    setRoomAllocations,
    images,
    setImages,
    originalRoomTypes,
    setOriginalRoomTypes
  } = usePGFormState(pg, open);

  const { onSubmit, isSubmitting } = usePGFormSubmit({
    form,
    managers,
    roomTypes,
    roomAllocations,
    images,
    originalRoomTypes,
    isEdit,
    pg,
    onSave,
    onClose
  });

  const handleClose = () => {
    if (isSubmitting) {
      toast({
        title: 'Please Wait',
        description: 'Form is being submitted. Please wait...',
        variant: 'destructive'
      });
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEdit ? `Edit ${pg?.name}` : 'Add New PG'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the PG information below' 
              : 'Fill in the details to create a new PG property'
            }
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <PGFormFields
            form={form}
            managers={managers}
            images={images}
            setImages={setImages}
            isEdit={isEdit}
          />

          {!isEdit && (
            <PGFormRoomAllocation
              form={form}
              roomTypes={roomTypes}
              setRoomTypes={setRoomTypes}
              roomAllocations={roomAllocations}
              setRoomAllocations={setRoomAllocations}
            />
          )}

          <PGFormActions
            onCancel={handleClose}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PGForm;
