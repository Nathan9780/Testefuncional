import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buscar perfil do usuário
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar perfil:", error);
      }
      return data;
    } catch (error) {
      console.error("Erro:", error);
      return null;
    }
  };

  // Criar perfil se não existir
  const ensureProfile = async (userId, email, metadata) => {
    try {
      // Verificar se já existe
      const existing = await fetchProfile(userId);
      if (existing) return existing;

      // Criar novo perfil
      const { data, error } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: userId,
            email: email,
            full_name: metadata?.full_name || email.split("@")[0],
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar perfil:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Erro ao criar perfil:", error);
      return null;
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates) => {
    if (!user) return { error: new Error("Usuário não autenticado") };

    try {
      // Primeiro garantir que o perfil existe
      await ensureProfile(user.id, user.email, user.user_metadata);

      // Atualizar o perfil
      const { error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Buscar o perfil atualizado
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);

      return { error: null, data: updatedProfile };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return { error };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const userProfile = await ensureProfile(
            session.user.id,
            session.user.email,
            session.user.user_metadata,
          );
          setProfile(userProfile);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro na inicialização:", error);
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const userProfile = await ensureProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata,
        );
        setProfile(userProfile);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

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
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    }
    return { error };
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
