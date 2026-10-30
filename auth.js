import { isSupabaseConfigured, supabase } from "./supabase-config.js";

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Настройте URL Supabase и публичный ключ в .env.local.");
  }
  return supabase;
}

export async function getCurrentSession() {
  return requireClient().auth.getSession();
}

export async function signIn(email, password) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const { data, error } = await requireClient().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(callback) {
  return requireClient().auth.onAuthStateChange(callback).data.subscription;
}
