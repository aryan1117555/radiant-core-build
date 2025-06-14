import { supabase } from '@/integrations/supabase/client';
import { PG, ensureStringArray, ensurePGType } from '@/types';
import { logError } from './pgUtils';

export const addPG = async (pgData: Omit<PG, 'id'>): Promise<PG> => {
  console.log('Creating new PG with data:', pgData);
  
  try {
    // Validate required fields
    if (!pgData.name?.trim()) {
      throw new Error('PG name is required');
    }
    if (!pgData.location?.trim()) {
      throw new Error('Location is required');
    }
    if (!pgData.totalRooms || pgData.totalRooms < 1) {
      throw new Error('Total rooms must be at least 1');
    }

    // Prepare the data for database insertion with proper type casting
    const dbData = {
      name: pgData.name.trim(),
      address: pgData.location.trim(),
      description: pgData.contactInfo?.trim() || '',
      pg_type: ensurePGType(pgData.type),
      total_rooms: pgData.totalRooms || 0,
      occupied_rooms: 0, // New PG starts with 0 occupied rooms
      revenue: pgData.revenue || 0,
      monthly_rent: pgData.monthlyRent || 0,
      manager_id: pgData.managerId || null,
      amenities: JSON.stringify(pgData.amenities || []),
      images: JSON.stringify(pgData.images || [])
    };

    console.log('Inserting PG data into database:', dbData);

    // Insert the PG data
    const { data, error } = await supabase
      .from('pgs')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error creating PG in database:', error);
      logError('Error creating PG:', error);
      
      // Handle specific RLS error
      if (error.code === '42501' || error.message.includes('row-level security')) {
        throw new Error('Permission denied: You do not have permission to create PGs. Please contact your administrator.');
      }
      
      throw new Error(`Failed to create PG: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from PG creation');
    }

    console.log('PG created successfully in database:', data);

    // If room allocations are provided, create rooms
    if ((pgData as any).roomAllocations && Array.isArray((pgData as any).roomAllocations)) {
      console.log('Creating rooms for new PG...');
      try {
        await createRoomsFromAllocations(data.id, (pgData as any).roomAllocations);
      } catch (roomError) {
        console.error('Error creating rooms:', roomError);
        // Don't fail the entire operation if room creation fails
        console.warn('PG created but room creation failed. Rooms can be added manually.');
      }
    }

    // Transform the database result back to our PG type
    const createdPG: PG = {
      id: data.id,
      name: data.name,
      location: data.address || '',
      contactInfo: data.description || '',
      type: ensurePGType(data.pg_type),
      totalRooms: data.total_rooms || 0,
      totalBeds: pgData.totalBeds || 0,
      floors: pgData.floors || 1,
      images: ensureStringArray(data.images),
      amenities: ensureStringArray(data.amenities),
      roomTypes: pgData.roomTypes || [],
      revenue: data.revenue || 0,
      occupancyRate: 0,
      monthlyRent: data.monthly_rent || 0,
      managerId: data.manager_id,
      manager: pgData.manager
    };

    console.log('Returning created PG:', createdPG);
    return createdPG;

  } catch (error) {
    console.error('Error in addPG service:', error);
    logError('Error in addPG:', error);
    throw error;
  }
};

export const updatePG = async (id: string, pgData: PG): Promise<PG> => {
  console.log('Updating PG with ID:', id, 'Data:', pgData);
  
  try {
    // Validate required fields
    if (!pgData.name?.trim()) {
      throw new Error('PG name is required');
    }
    if (!pgData.location?.trim()) {
      throw new Error('Location is required');
    }

    // Prepare the data for database update with proper type casting
    const dbData = {
      name: pgData.name.trim(),
      address: pgData.location.trim(),
      description: pgData.contactInfo?.trim() || '',
      pg_type: ensurePGType(pgData.type),
      total_rooms: pgData.totalRooms || 0,
      revenue: pgData.revenue || 0,
      monthly_rent: pgData.monthlyRent || 0,
      manager_id: pgData.managerId || null,
      amenities: JSON.stringify(pgData.amenities || []),
      images: JSON.stringify(pgData.images || [])
    };

    console.log('Updating PG data in database:', dbData);

    const { data, error } = await supabase
      .from('pgs')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating PG in database:', error);
      logError('Error updating PG:', error);
      
      if (error.code === '42501' || error.message.includes('row-level security')) {
        throw new Error('Permission denied: You do not have permission to update this PG.');
      }
      
      throw new Error(`Failed to update PG: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from PG update');
    }

    console.log('PG updated successfully in database:', data);

    // Transform the database result back to our PG type
    const updatedPG: PG = {
      id: data.id,
      name: data.name,
      location: data.address || '',
      contactInfo: data.description || '',
      type: ensurePGType(data.pg_type),
      totalRooms: data.total_rooms || 0,
      totalBeds: pgData.totalBeds || 0,
      floors: pgData.floors || 1,
      images: ensureStringArray(data.images),
      amenities: ensureStringArray(data.amenities),
      roomTypes: pgData.roomTypes || [],
      revenue: data.revenue || 0,
      occupancyRate: pgData.occupancyRate || 0,
      monthlyRent: data.monthly_rent || 0,
      managerId: data.manager_id,
      manager: pgData.manager
    };

    console.log('Returning updated PG:', updatedPG);
    return updatedPG;

  } catch (error) {
    console.error('Error in updatePG service:', error);
    logError('Error in updatePG:', error);
    throw error;
  }
};

// Helper function to create rooms from allocations
const createRoomsFromAllocations = async (pgId: string, allocations: any[]) => {
  try {
    const roomsToCreate = [];

    for (const allocation of allocations) {
      const { floor, roomType, startNumber, endNumber } = allocation;
      
      for (let roomNum = startNumber; roomNum <= endNumber; roomNum++) {
        roomsToCreate.push({
          pg_id: pgId,
          room_number: `${floor}${roomNum.toString().padStart(2, '0')}`,
          room_type: roomType.name,
          capacity: roomType.capacity,
          rent: roomType.price,
          status: 'available'
        });
      }
    }

    if (roomsToCreate.length > 0) {
      console.log(`Creating ${roomsToCreate.length} rooms for PG ${pgId}`);
      
      const { error } = await supabase
        .from('rooms')
        .insert(roomsToCreate);

      if (error) {
        console.error('Error creating rooms:', error);
        throw new Error('Failed to create rooms for the PG');
      }

      console.log('Rooms created successfully');
    }
  } catch (error) {
    console.error('Error in createRoomsFromAllocations:', error);
    throw error;
  }
};
