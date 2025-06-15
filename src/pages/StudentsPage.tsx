
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import PageTabs from '@/components/PageTabs';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Student } from '@/types';
import { format } from 'date-fns';
import { fetchStudents } from '@/services/studentService';
import { fetchRooms } from '@/services/roomService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Trash2 } from 'lucide-react';

const StudentsPage = () => {
  const {
    pgs,
    rooms: contextRooms,
    clearAllStudents
  } = useData();
  
  const [activeTab, setActiveTab] = useState("all");
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [students, setStudents] = useState<(Student & {
    roomNumber?: string;
    pgName?: string;
  })[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Cache for expensive computations
  const [dataCache, setDataCache] = useState<{
    roomMap?: Map<string, any>;
    pgMap?: Map<string, any>;
    lastUpdate?: number;
  }>({});

  // Memoize helper function
  const isDemoStudent = useCallback((studentId: string): boolean => {
    return studentId.startsWith('student-') && /^student-\d+$/.test(studentId);
  }, []);

  // Memoize tabs to prevent recreation
  const tabs = useMemo(() => [
    { id: "all", label: "All Students" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending Payments" },
    { id: "archived", label: "Archived" }
  ], []);

  // Memoize permission check
  const hasDeletePermission = useMemo(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  // Create optimized maps for lookups
  const { roomMap, pgMap } = useMemo(() => {
    const now = Date.now();
    
    // Use cached maps if they exist and are recent (less than 30 seconds old)
    if (dataCache.roomMap && dataCache.pgMap && dataCache.lastUpdate && 
        (now - dataCache.lastUpdate) < 30000) {
      return { roomMap: dataCache.roomMap, pgMap: dataCache.pgMap };
    }
    
    const newRoomMap = new Map(contextRooms.map(room => [room.id, room]));
    const newPgMap = new Map(pgs.map(pg => [pg.id, pg]));
    
    // Update cache
    setDataCache({
      roomMap: newRoomMap,
      pgMap: newPgMap,
      lastUpdate: now
    });
    
    return { roomMap: newRoomMap, pgMap: newPgMap };
  }, [contextRooms, pgs, dataCache]);

  // Memoize filtered students for better performance
  const filteredStudents = useMemo(() => {
    if (students.length === 0) return [];
    
    const today = new Date();
    
    switch (activeTab) {
      case "active":
        return students.filter(student => new Date(student.endDate) > today);
      case "pending":
        return students.filter(student => {
          const paid = student.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
          return paid < student.totalFees;
        });
      case "archived":
        return students.filter(student => new Date(student.endDate) <= today);
      default:
        return students;
    }
  }, [students, activeTab]);

  // Memoize viewing student
  const viewingStudent = useMemo(() => {
    return viewStudentId ? students.find(student => student.id === viewStudentId) : null;
  }, [viewStudentId, students]);

  // Optimized data loading with caching
  const loadStudentsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      let allStudents: Student[] = [];

      if (user?.id?.startsWith('demo-')) {
        // Use cached demo data - no network call needed
        const demoStudents = JSON.parse(localStorage.getItem('demo-students') || '[]');
        const roomStudents = contextRooms.flatMap(room => 
          (room.students || []).map(student => ({
            ...student,
            roomId: room.id,
            pgId: room.pgId
          }))
        );
        
        // Use Set for deduplication (faster than array methods)
        const studentMap = new Map();
        [...demoStudents, ...roomStudents].forEach(student => {
          studentMap.set(student.id, student);
        });
        
        allStudents = Array.from(studentMap.values());
      } else {
        // For real users, fetch from database only if needed
        allStudents = await fetchStudents();
      }

      // Use pre-computed maps for faster lookups
      const studentsWithRoomInfo = allStudents.map(student => {
        const room = roomMap.get(student.roomId);
        const pg = pgMap.get(student.pgId);
        
        return {
          ...student,
          roomNumber: room?.number || room?.room_number || 'N/A',
          pgName: pg?.name || 'N/A',
          pgId: pg?.id || student.pgId
        };
      });

      // Apply role-based filtering efficiently
      let filteredStudents = studentsWithRoomInfo;
      if (user?.role === 'manager') {
        const assignedPgIds = user.assignedPGs && Array.isArray(user.assignedPGs) && user.assignedPGs.length > 0
          ? new Set(pgs.filter(pg => user.assignedPGs?.includes(pg.name)).map(pg => pg.id))
          : new Set(pgs.filter(pg => pg.managerId === user.id).map(pg => pg.id));
        
        filteredStudents = studentsWithRoomInfo.filter(student => 
          student.pgId && assignedPgIds.has(student.pgId)
        );
      }

      setStudents(filteredStudents);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [user, roomMap, pgMap, contextRooms, pgs, toast]);

  // Load data only when necessary
  useEffect(() => {
    if (!initialLoad && students.length > 0) return; // Skip if data already loaded
    
    loadStudentsData();
  }, [loadStudentsData, initialLoad, students.length]);

  // Memoize handlers to prevent recreation
  const handleAddStudentClick = useCallback(() => {
    navigate('/add-student');
  }, [navigate]);

  const handleViewStudent = useCallback((studentId: string) => {
    setViewStudentId(studentId);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setViewStudentId(null);
  }, []);

  const handleDeleteStudent = useCallback(async (studentId: string) => {
    try {
      if (user?.id?.startsWith('demo-') || isDemoStudent(studentId)) {
        const demoStudents = JSON.parse(localStorage.getItem('demo-students') || '[]');
        const updatedStudents = demoStudents.filter((s: any) => s.id !== studentId);
        localStorage.setItem('demo-students', JSON.stringify(updatedStudents));
        
        setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
        
        toast({
          title: "Success",
          description: "Student deleted successfully."
        });
      } else {
        const { deleteStudent } = await import('@/services/studentService');
        const success = await deleteStudent(studentId);
        
        if (success) {
          setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
          toast({
            title: "Success",
            description: "Student deleted successfully."
          });
        } else {
          throw new Error("Failed to delete student from database");
        }
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, isDemoStudent, toast]);

  const handleClearAllStudents = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete ALL students and their data? This action cannot be undone and will remove all student records and payment history.")) {
      return;
    }

    try {
      localStorage.removeItem('demo-students');
      setStudents([]);
      
      if (!user?.id?.startsWith('demo-')) {
        const { clearAllStudentData } = await import('@/services/studentService');
        const success = await clearAllStudentData();
        if (!success) {
          throw new Error("Failed to clear database student data");
        }
        await clearAllStudents();
      }
      
      toast({
        title: "Success",
        description: "All student data has been cleared successfully."
      });
    } catch (error) {
      console.error("Error clearing all student data:", error);
      toast({
        title: "Error",
        description: "Failed to clear all student data. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, clearAllStudents, toast]);

  // Memoize format date function
  const formatDate = useCallback((date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  }, []);

  // Optimized student card component
  const StudentCard = React.memo(({ student, onView, onDelete }: { 
    student: any, 
    onView: (id: string) => void, 
    onDelete: (id: string) => void 
  }) => {
    const paidAmount = useMemo(() => 
      (student.payments || []).reduce((sum: number, payment: any) => sum + payment.amount, 0), 
      [student.payments]
    );
    
    const paymentStatus = useMemo(() => {
      const isPaid = paidAmount >= student.totalFees;
      const isPartial = paidAmount > 0 && paidAmount < student.totalFees;
      
      return {
        isPaid,
        isPartial,
        className: isPaid ? 'bg-green-100 text-green-800' : 
                   isPartial ? 'bg-yellow-100 text-yellow-800' : 
                   'bg-red-100 text-red-800',
        label: isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'
      };
    }, [paidAmount, student.totalFees]);

    return (
      <div className="p-4 bg-slate-950">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-white text-lg">{student.name}</h3>
            <p className="text-sm text-gray-300">{student.phone}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.className}`}>
            {paymentStatus.label}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-gray-400">Room:</span>
            <span className="ml-1 text-white">{student.roomNumber}</span>
          </div>
          <div>
            <span className="text-gray-400">PG:</span>
            <span className="ml-1 text-white">{student.pgName}</span>
          </div>
          <div>
            <span className="text-gray-400">Occupation:</span>
            <span className="ml-1 text-white">{student.occupation}</span>
          </div>
          <div>
            <span className="text-gray-400">Total Fees:</span>
            <span className="ml-1 text-white">₹{student.totalFees.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(student.id)} className="flex-1">
            View
          </Button>
          {hasDeletePermission && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete ${student.name}? This action cannot be undone.`)) {
                  onDelete(student.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  });

  // Optimized tab content rendering
  const renderTabContent = useCallback(() => {
    if (loading && initialLoad) {
      return (
        <div className="rounded-lg shadow p-4 sm:p-6 text-center bg-slate-950">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      );
    }

    if (user?.role === 'manager' && students.length === 0 && !loading) {
      return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 text-center">
          <p className="text-muted-foreground">No students found for your assigned PGs.</p>
        </div>
      );
    }

    if (filteredStudents.length === 0 && !loading) {
      return (
        <div className="rounded-lg shadow p-4 sm:p-6 text-center bg-slate-950">
          <p className="text-muted-foreground">No students found in this category.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden divide-y divide-gray-200">
          {filteredStudents.map(student => (
            <StudentCard 
              key={student.id}
              student={student}
              onView={handleViewStudent}
              onDelete={handleDeleteStudent}
            />
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full bg-slate-950">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Room</th>
                <th className="px-4 py-3 text-left text-sm font-medium">PG</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Occupation</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Total Fees</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Paid Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.map(student => {
                const paidAmount = (student.payments || []).reduce((sum: number, payment: any) => sum + payment.amount, 0);
                const isPaid = paidAmount >= student.totalFees;
                const isPartial = paidAmount > 0 && paidAmount < student.totalFees;
                
                return (
                  <tr key={student.id}>
                    <td className="px-4 py-4 text-sm bg-gray-950">{student.name}</td>
                    <td className="px-4 py-4 text-sm bg-slate-950">{student.roomNumber}</td>
                    <td className="px-4 py-4 text-sm bg-gray-950">{student.pgName}</td>
                    <td className="px-4 py-4 text-sm bg-slate-950">{student.phone}</td>
                    <td className="px-4 py-4 text-sm bg-slate-950">{student.occupation}</td>
                    <td className="px-4 py-4 text-sm bg-slate-950">₹{student.totalFees.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm bg-slate-950">₹{paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm bg-slate-950">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isPaid ? 'bg-green-100 text-green-800' : 
                        isPartial ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm bg-slate-950">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewStudent(student.id)}>
                          View
                        </Button>
                        {hasDeletePermission && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete ${student.name}? This action cannot be undone.`)) {
                                handleDeleteStudent(student.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [loading, initialLoad, user, students, filteredStudents, hasDeletePermission, handleViewStudent, handleDeleteStudent]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Students</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {hasDeletePermission && (
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 w-full sm:w-auto"
              onClick={handleClearAllStudents}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Students
            </Button>
          )}
          <Button onClick={handleAddStudentClick} className="w-full sm:w-auto">
            Add New Student
          </Button>
        </div>
      </div>
      
      <PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      {renderTabContent()}
      
      {/* Student Details Dialog */}
      <Dialog open={Boolean(viewStudentId)} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">Student Details</DialogTitle>
          </DialogHeader>
          
          {viewingStudent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">Personal Information</h3>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Name:</span>
                    <span className="sm:text-right">{viewingStudent.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Phone:</span>
                    <span className="sm:text-right">{viewingStudent.phone}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Occupation:</span>
                    <span className="sm:text-right">{viewingStudent.occupation}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Aadhaar:</span>
                    <span className="sm:text-right">XXXX XXXX {viewingStudent.aadhaarNumber ? viewingStudent.aadhaarNumber.slice(-4) : 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Room Number:</span>
                    <span className="sm:text-right">{viewingStudent.roomNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">PG:</span>
                    <span className="sm:text-right">{viewingStudent.pgName}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">Stay Information</h3>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Start Date:</span>
                    <span className="sm:text-right">{formatDate(viewingStudent.startDate)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">End Date:</span>
                    <span className="sm:text-right">{formatDate(viewingStudent.endDate)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Total Fees:</span>
                    <span className="sm:text-right">₹{viewingStudent.totalFees.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Deposit:</span>
                    <span className="sm:text-right">₹{viewingStudent.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">Paid Amount:</span>
                    <span className="sm:text-right">₹{viewingStudent.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {viewingStudent.address && (
                <div className="col-span-1 lg:col-span-2">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Address</h3>
                  <p className="text-muted-foreground break-words">{viewingStudent.address}</p>
                </div>
              )}
              
              <div className="col-span-1 lg:col-span-2">
                <h3 className="text-base sm:text-lg font-semibold mb-3">Payment History</h3>
                {viewingStudent.payments && viewingStudent.payments.length > 0 ? (
                  <div className="overflow-x-auto border rounded">
                    <table className="min-w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 text-left text-sm">Date</th>
                          <th className="px-2 sm:px-4 py-2 text-left text-sm">Amount</th>
                          <th className="px-2 sm:px-4 py-2 text-left text-sm">Mode</th>
                          <th className="px-2 sm:px-4 py-2 text-left text-sm">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {viewingStudent.payments.map((payment: any, index: number) => (
                          <tr key={index}>
                            <td className="px-2 sm:px-4 py-2 text-sm">{formatDate(payment.date)}</td>
                            <td className="px-2 sm:px-4 py-2 text-sm">₹{payment.amount.toLocaleString()}</td>
                            <td className="px-2 sm:px-4 py-2 text-sm">{payment.mode}</td>
                            <td className="px-2 sm:px-4 py-2 text-sm">{payment.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No payment records found.</p>
                )}
              </div>
              
              <div className="col-span-1 lg:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                  Close
                </Button>
                <Button onClick={() => navigate(`/edit-student/${viewingStudent.id}`)} className="w-full sm:w-auto">
                  Edit Details
                </Button>
                {hasDeletePermission && (
                  <Button 
                    variant="outline" 
                    className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 w-full sm:w-auto"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete ${viewingStudent.name}? This action cannot be undone.`)) {
                        handleDeleteStudent(viewingStudent.id);
                        handleCloseDialog();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Student
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
