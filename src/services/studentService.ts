
import { supabase } from '@/integrations/supabase/client';
import { Student, Payment } from '@/types';

export const searchStudents = async (searchTerm: string): Promise<Student[]> => {
  try {
    console.log('Searching students with term:', searchTerm);
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        payments (*)
      `)
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,aadhaar_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching students:', error);
      throw error;
    }

    return transformStudentsFromDB(data || []);
  } catch (error) {
    console.error('Error in searchStudents:', error);
    throw error;
  }
};

export const fetchStudents = async (): Promise<Student[]> => {
  try {
    console.log('Fetching all students...');
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        payments (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      throw error;
    }

    console.log('Fetched students from database:', data?.length || 0);
    return transformStudentsFromDB(data || []);
  } catch (error) {
    console.error('Error in fetchStudents:', error);
    throw error;
  }
};

export const fetchStudentById = async (id: string): Promise<Student | null> => {
  try {
    console.log('Fetching student by ID:', id);
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        payments (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Student not found
      }
      console.error('Error fetching student by ID:', error);
      throw error;
    }

    const students = transformStudentsFromDB([data]);
    return students[0] || null;
  } catch (error) {
    console.error('Error in fetchStudentById:', error);
    return null;
  }
};

export const addStudent = async (studentData: Omit<Student, 'id' | 'payments'>): Promise<Student> => {
  try {
    console.log('Adding new student:', studentData);
    
    const dbData = {
      name: studentData.name,
      phone: studentData.phone,
      address: studentData.address,
      aadhaar_number: studentData.aadhaarNumber,
      occupation: studentData.occupation,
      total_fees: studentData.totalFees,
      deposit: studentData.deposit,
      start_date: studentData.startDate.toISOString().split('T')[0],
      end_date: studentData.endDate.toISOString().split('T')[0],
      room_id: studentData.roomId,
      pg_id: studentData.pgId
    };

    const { data, error } = await supabase
      .from('students')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error adding student:', error);
      throw error;
    }

    console.log('Student added successfully:', data);
    
    // Transform back to our Student type
    const student: Student = {
      id: data.id,
      name: data.name,
      phone: data.phone || '',
      address: data.address || '',
      aadhaarNumber: data.aadhaar_number || '',
      occupation: data.occupation || '',
      totalFees: data.total_fees || 0,
      deposit: data.deposit || 0,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      roomId: data.room_id || '',
      pgId: data.pg_id,
      payments: []
    };

    return student;
  } catch (error) {
    console.error('Error in addStudent:', error);
    throw error;
  }
};

export const removeStudent = async (id: string): Promise<boolean> => {
  try {
    console.log('Removing student with ID:', id);
    
    // First delete all payments for this student
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('student_id', id);

    if (paymentsError) {
      console.error('Error deleting student payments:', paymentsError);
      throw paymentsError;
    }

    // Then delete the student
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing student:', error);
      throw error;
    }

    console.log('Student removed successfully');
    return true;
  } catch (error) {
    console.error('Error in removeStudent:', error);
    throw error;
  }
};

export const deleteStudent = async (id: string): Promise<boolean> => {
  try {
    console.log('Deleting student with ID:', id);
    
    // First delete all payments for this student
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('student_id', id);

    if (paymentsError) {
      console.error('Error deleting student payments:', paymentsError);
      throw paymentsError;
    }

    // Then delete the student
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting student:', error);
      throw error;
    }

    console.log('Student deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    throw error;
  }
};

export const clearAllStudentData = async (): Promise<boolean> => {
  try {
    console.log('Clearing all student data...');
    
    // First delete all payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (paymentsError) {
      console.error('Error clearing payments:', paymentsError);
      throw paymentsError;
    }

    // Then delete all students
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (studentsError) {
      console.error('Error clearing students:', studentsError);
      throw studentsError;
    }

    console.log('All student data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error in clearAllStudentData:', error);
    throw error;
  }
};

export const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
  try {
    console.log('Adding payment:', paymentData);
    
    const dbData = {
      student_id: paymentData.studentId,
      amount: paymentData.amount,
      date: paymentData.date.toISOString().split('T')[0],
      mode: paymentData.mode,
      note: paymentData.note,
      approval_status: paymentData.approvalStatus || 'pending'
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error adding payment:', error);
      throw error;
    }

    console.log('Payment added successfully:', data);
    
    // Transform back to our Payment type
    const payment: Payment = {
      id: data.id,
      studentId: data.student_id,
      amount: data.amount,
      date: new Date(data.date),
      mode: data.mode as any,
      note: data.note,
      approvalStatus: data.approval_status as any
    };

    return payment;
  } catch (error) {
    console.error('Error in addPayment:', error);
    throw error;
  }
};

export const updatePaymentApproval = async (paymentId: string, status: 'approved' | 'rejected', userId: string): Promise<boolean> => {
  try {
    console.log('Updating payment approval:', paymentId, status, userId);
    
    const { error } = await supabase
      .from('payments')
      .update({
        approval_status: status,
        approved_by: userId,
        approved_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Error updating payment approval:', error);
      throw error;
    }

    console.log('Payment approval updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updatePaymentApproval:', error);
    throw error;
  }
};

export const getPendingPayments = async (): Promise<any[]> => {
  try {
    console.log('Fetching pending payments...');
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students (
          name,
          pgs (name)
        )
      `)
      .eq('approval_status', 'pending');

    if (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }

    // Transform the data
    const pendingPayments = data.map(payment => ({
      id: payment.id,
      studentId: payment.student_id,
      studentName: payment.students?.name || 'Unknown',
      pgName: payment.students?.pgs?.name || 'Unknown PG',
      amount: payment.amount,
      date: new Date(payment.date),
      mode: payment.mode,
      note: payment.note,
      approvalStatus: payment.approval_status
    }));

    console.log('Fetched pending payments:', pendingPayments.length);
    return pendingPayments;
  } catch (error) {
    console.error('Error in getPendingPayments:', error);
    return [];
  }
};

export const getStudentsByRoomId = async (roomId: string): Promise<Student[]> => {
  try {
    console.log('Fetching students for room ID:', roomId);
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        payments (*)
      `)
      .eq('room_id', roomId);

    if (error) {
      console.error('Error fetching students by room ID:', error);
      throw error;
    }

    return transformStudentsFromDB(data || []);
  } catch (error) {
    console.error('Error in getStudentsByRoomId:', error);
    throw error;
  }
};

// Helper function to transform database students to our Student type
const transformStudentsFromDB = (dbStudents: any[]): Student[] => {
  return dbStudents.map(dbStudent => {
    const payments: Payment[] = (dbStudent.payments || []).map((payment: any) => ({
      id: payment.id,
      studentId: payment.student_id,
      amount: payment.amount,
      date: new Date(payment.date),
      mode: payment.mode,
      note: payment.note,
      approvalStatus: payment.approval_status
    }));

    return {
      id: dbStudent.id,
      name: dbStudent.name,
      phone: dbStudent.phone || '',
      address: dbStudent.address || '',
      aadhaarNumber: dbStudent.aadhaar_number || '',
      occupation: dbStudent.occupation || '',
      totalFees: dbStudent.total_fees || 0,
      deposit: dbStudent.deposit || 0,
      startDate: new Date(dbStudent.start_date),
      endDate: new Date(dbStudent.end_date),
      roomId: dbStudent.room_id || '',
      pgId: dbStudent.pg_id,
      payments
    };
  });
};
