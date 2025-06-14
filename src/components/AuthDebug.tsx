
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const AuthDebug: React.FC = () => {
  const { user } = useAuth();
  const [sessionCheck, setSessionCheck] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        setSessionCheck({ session: session?.user?.email, error });
        console.log('AuthDebug: Session check:', { session: session?.user?.email, error });
      } catch (err) {
        console.error('AuthDebug: Session check failed:', err);
        setSessionCheck({ error: err });
      }
    };

    checkSession();
  }, []);

  if (!user) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <h3 className="font-bold text-red-800">Authentication Debug</h3>
        <p className="text-red-700">No user found in context</p>
        <p className="text-sm text-red-600">Session: {sessionCheck?.session || 'None'}</p>
        {sessionCheck?.error && (
          <p className="text-sm text-red-600">Error: {JSON.stringify(sessionCheck.error)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-100 border border-green-300 rounded">
      <h3 className="font-bold text-green-800">Authentication Debug</h3>
      <p className="text-green-700">User: {user.email}</p>
      <p className="text-sm text-green-600">ID: {user.id}</p>
      <p className="text-sm text-green-600">Session: {sessionCheck?.session || 'Loading...'}</p>
    </div>
  );
};

export default AuthDebug;
