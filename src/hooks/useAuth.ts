import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setIsLoading, reset } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  const signUp = async (email: string, password: string, name: string, university: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          university,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Este correo ya está registrado',
          description: '¿Ya tienes una cuenta? Intenta iniciar sesión.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error al registrarse',
          description: error.message,
          variant: 'destructive',
        });
      }
      return { error };
    }

    toast({
      title: `¡Bienvenida, ${name}!`,
      description: '¿Qué querés organizar hoy?',
    });

    navigate('/dashboard');
    return { data };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: 'Correo o contraseña incorrectos',
        variant: 'destructive',
      });
      return { error };
    }

    navigate('/dashboard');
    return { data };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    reset();
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Correo enviado',
      description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
    });

    return { success: true };
  };

  const updateProfile = async (updates: { name?: string; university?: string; semester_goal?: string; daily_learnings?: string }) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'No hay usuario autenticado',
        variant: 'destructive',
      });
      return { error: new Error('No user') };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error al actualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    if (data) {
      setProfile(data);
      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios se han guardado correctamente.',
      });
    }

    return { data };
  };

  return {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    fetchProfile,
    updateProfile,
  };
};
