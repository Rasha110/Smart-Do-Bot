'use server'

import { createClient } from '@/app/lib/supabase-server'
import { revalidatePath } from 'next/cache'

type SignUpData = {
  email: string
  password: string
  name: string
}

type SignInData = {
  email: string
  password: string
}

export async function signUp(data: SignUpData) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    })
    
    if (error) {
      return { error: error.message }
    }
    
    revalidatePath('/todos')
    return { success: true }; 
  }
  
  export async function signIn(data: SignInData) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    revalidatePath('/todos')
    return { success: true }; 
  }

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) return { error: error.message };

  return { success: true };
}