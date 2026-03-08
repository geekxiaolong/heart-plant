import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Loader2 } from 'lucide-react';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check local session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-green-500 mb-4" size={48} />
        <p className="text-gray-500 font-bold tracking-widest uppercase">验证身份中...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
}
