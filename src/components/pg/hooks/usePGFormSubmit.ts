
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PG, RoomType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PGFormValues } from '@/components/pg/types';
import { FloorAllocation } from '@/components/pg/PGFormRoomAllocation';
import { supabase } from '@/integrations/supabase/client';

interface UsePGFormSubmitProps {
  form: UseFormReturn<PGFormValues>;
  managers: any[];
  roomTypes: RoomType[];
  roomAllocations: FloorAllocation[];
  images: string[];
  originalRoomTypes: RoomType[];
  isEdit: boolean;
  pg?: PG;
  onSave: (pg: Omit<PG, 'id'> | PG) => Promise<boolean>;
  onClose: () => void;
}

export const usePGFormSubmit = ({
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
}: UsePGFormSubmitProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: PGFormValues) => {
    if (isSubmitting) {
      console.log("usePGFormSubmit: Already submitting, ignoring duplicate submission");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("usePGFormSubmit: Form submission started with values:", values);

      // Check authentication status first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("usePGFormSubmit: Auth check:", { user: user?.email, authError });
      
      if (authError || !user) {
        console.error("usePGFormSubmit: Authentication failed:", authError);
        toast({
          title: 'Authentication Error',
          description: 'Please log in again to continue.',
          variant: 'destructive'
        });
        return;
      }

      // Basic validation
      if (!values.name?.trim()) {
        toast({
          title: 'Validation Error',
          description: 'PG name is required',
          variant: 'destructive'
        });
        return;
      }

      if (!values.location?.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Location is required',
          variant: 'destructive'
        });
        return;
      }

      let selectedManager = null;
      if (values.managerId && values.managerId !== 'none' && values.managerId !== '') {
        selectedManager = managers.find(m => m.id === values.managerId);
      }
      
      // Create the PG data object
      let pgData: PG | Omit<PG, 'id'> = {
        name: values.name.trim(),
        type: values.type as 'male' | 'female' | 'unisex',
        location: values.location.trim(),
        contactInfo: values.contactInfo?.trim() || '',
        totalRooms: Math.max(1, values.totalRooms),
        totalBeds: Math.max(1, values.totalBeds),
        floors: Math.max(1, values.floors),
        images: images || [],
        amenities: [],
        roomTypes: roomTypes.map(rt => ({
          id: rt.id || `rt_${Date.now()}_${Math.random()}`,
          name: rt.name,
          capacity: rt.capacity,
          amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
          price: rt.price
        })),
        revenue: pg?.revenue || 0,
        occupancyRate: pg?.occupancyRate || 0,
        monthlyRent: pg?.monthlyRent || 0,
        actualOccupancy: pg?.actualOccupancy || 0,
        totalCapacity: pg?.totalCapacity || 0,
        managerId: selectedManager?.id || null,
        manager: selectedManager?.name || null
      };
      
      console.log("usePGFormSubmit: Final PG data before save:", pgData);
      
      // Add room allocations for new PGs
      if (!isEdit && roomAllocations.length > 0) {
        (pgData as any).roomAllocations = roomAllocations;
        console.log("usePGFormSubmit: Added room allocations to PG data");
      }
      
      // For edit mode, include the ID
      if (isEdit && pg) {
        (pgData as PG).id = pg.id;
      }
      
      console.log("usePGFormSubmit: Calling onSave with data:", pgData);
      const success = await onSave(pgData);
      
      if (success) {
        console.log("usePGFormSubmit: PG save successful");
        onClose();
        
        if (!isEdit) {
          form.reset({
            name: '',
            type: 'male',
            location: '',
            contactInfo: '',
            totalRooms: 1,
            totalBeds: 1,
            floors: 1,
            managerId: '',
            images: []
          });
        }
      } else {
        console.log("usePGFormSubmit: PG save failed");
      }
    } catch (error: any) {
      console.error("usePGFormSubmit: Error in form submit:", error);
      
      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} PG. Please try again.`;
      
      if (error.message) {
        if (error.message.includes('Please log in')) {
          errorMessage = 'Authentication expired. Please log in again.';
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'A PG with this name already exists. Please choose a different name.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    onSubmit,
    isSubmitting
  };
};
