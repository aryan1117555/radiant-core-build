
import React from 'react';
import { Button } from '@/components/ui/button';

interface PGFormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
}

const PGFormActions: React.FC<PGFormActionsProps> = ({
  onCancel,
  isSubmitting,
  isEdit
}) => {
  return (
    <div className="flex justify-end gap-4 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update PG' : 'Create PG')}
      </Button>
    </div>
  );
};

export default PGFormActions;
