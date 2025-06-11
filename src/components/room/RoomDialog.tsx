
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Room, PG } from '@/types';
import RoomForm from './RoomForm';

interface RoomDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (room: Omit<Room, 'id'> | Room) => Promise<void>;
  room?: Room;
  pgs: PG[];
  isEdit?: boolean;
}

const RoomDialog: React.FC<RoomDialogProps> = ({
  open,
  onClose,
  onSave,
  room,
  pgs,
  isEdit = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {isEdit ? `Edit Room ${room?.number}` : 'Add New Room'}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {isEdit 
              ? 'Update the room information below' 
              : 'Fill in the details to create a new room'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <RoomForm
            onSave={onSave}
            onCancel={onClose}
            room={room}
            pgs={pgs}
            isEdit={isEdit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDialog;
