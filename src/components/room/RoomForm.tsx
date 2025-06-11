
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room, PG } from '@/types';
import { useToast } from '@/hooks/use-toast';

const roomFormSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  type: z.string().min(1, 'Room type is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  rent: z.number().min(0, 'Rent cannot be negative'),
  pgId: z.string().min(1, 'PG selection is required'),
  status: z.enum(['available', 'occupied', 'maintenance'])
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface RoomFormProps {
  onSave: (room: Omit<Room, 'id'> | Room) => Promise<void>;
  onCancel: () => void;
  room?: Room;
  pgs: PG[];
  isEdit?: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({
  onSave,
  onCancel,
  room,
  pgs,
  isEdit = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      number: room?.number || '',
      type: room?.type || '',
      capacity: room?.capacity || 1,
      rent: room?.rent || 0,
      pgId: room?.pgId || '',
      status: (room?.status === 'vacant' || room?.status === 'partial' || room?.status === 'full') 
        ? 'available' 
        : (room?.status || 'available')
    }
  });

  // Reset form when room changes
  useEffect(() => {
    if (room) {
      form.reset({
        number: room.number,
        type: room.type,
        capacity: room.capacity,
        rent: room.rent,
        pgId: room.pgId,
        status: (room.status === 'vacant' || room.status === 'partial' || room.status === 'full') 
          ? 'available' 
          : (room.status || 'available')
      });
    }
  }, [room, form]);

  const onSubmit = async (data: RoomFormValues) => {
    setIsSubmitting(true);
    
    try {
      const roomData: Omit<Room, 'id'> | Room = {
        ...(isEdit && room?.id ? { id: room.id } : {}),
        number: data.number,
        type: data.type,
        capacity: data.capacity,
        rent: data.rent,
        pgId: data.pgId,
        status: data.status,
        pgName: pgs.find(pg => pg.id === data.pgId)?.name || '',
        occupants: room?.occupants || []
      };

      await onSave(roomData);
      
      toast({
        title: "Success",
        description: `Room ${data.number} has been ${isEdit ? 'updated' : 'created'} successfully.`,
      });
      
      if (!isEdit) {
        form.reset();
      }
      
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEdit ? 'update' : 'create'} room. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pgId"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>PG Property</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PG" />
                    </SelectTrigger>
                    <SelectContent>
                      {pgs.map((pg) => (
                        <SelectItem key={pg.id} value={pg.id}>
                          {pg.name} - {pg.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 101, A-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Single, Double, Shared" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Rent (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Room" : "Create Room"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RoomForm;
