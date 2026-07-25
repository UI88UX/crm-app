import { cache } from 'react';
import { createClient } from './server';

export const getPatients = cache(async () => {
  const supabase = await createClient();
  
  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
    return [];
  }

  return patients || [];
});

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});