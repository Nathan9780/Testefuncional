import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Tentar pegar sessão com retry
        let session = null;
        let error = null;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            const result = await supabase.auth.getSession();
            if (!result.error) {
              session = result.data.session;
              error = null;
              break;
            }
            error = result.error;
          } catch (e) {
            error = e;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
        
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Buscar perfil
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileData) {
              setProfile(profileData);
            } else {
              // Criar perfil se não existir
              const { data: newProfile } = await supabase
                .from('user_profiles')
                .insert([{
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0]
                }])
                .select()
                .single();
              
              if (newProfile) setProfile(newProfile);
            }
          } catch (profileError) {
            console.error('Erro no perfil:', profileError);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth event:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Erro ao sair:', error);
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};