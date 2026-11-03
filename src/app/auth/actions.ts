'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signIn(formData: { email: string; password: string }) {
  const supabase = await createClient();

  let { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  // If login failed, check if user exists in Supabase Auth but has unconfirmed email
  if (error) {
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users.find(
          (u) => u.email?.toLowerCase() === formData.email.toLowerCase()
        );

        if (existing && !existing.email_confirmed_at) {
          // Auto-confirm the email on the fly
          await adminClient.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
          });

          // Retry sign-in
          const retry = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (!retry.error && retry.data.user) {
            data = retry.data;
            error = null;
          }
        }
      } catch (adminErr) {
        console.error('Error during admin auto-confirmation check:', adminErr);
      }
    }
  }

  if (error || !data.user) {
    return { error: error?.message || 'Invalid login credentials' };
  }

  // Determine redirection target based on app_metadata or user_metadata
  const user = data.user;
  const role = (user.app_metadata?.role || user.user_metadata?.role || 'patient') as string;

  let redirectUrl = '/patient/dashboard';
  if (role === 'doctor') redirectUrl = '/hospital/doctor';
  else if (role === 'lab_staff') redirectUrl = '/hospital/lab';
  else if (role === 'registrar') redirectUrl = '/hospital/registrar';
  else if (role === 'hospital_admin') redirectUrl = '/hospital/admin';
  else if (role === 'platform_admin') redirectUrl = '/platform-admin/verifications';

  revalidatePath('/', 'layout');
  return { success: true, redirectUrl };
}

export async function signUpPatient(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  address_line?: string;
  city?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}) {
  const adminClient = createAdminClient();

  if (adminClient) {
    // 1. Create confirmed user directly with admin privileges
    const { data: adminUser, error: adminError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
        phone: params.phone,
        role: 'patient',
        dob: params.dob,
        gender: params.gender,
        blood_group: params.bloodGroup,
        address_line: params.address_line,
        city: params.city,
        pincode: params.pincode,
        emergency_contact_name: params.emergency_contact_name,
        emergency_contact_phone: params.emergency_contact_phone,
      },
    });

    if (adminError) {
      // If user already registered, update their password and confirm them
      if (adminError.message.toLowerCase().includes('already') || adminError.status === 422) {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users.find(
          (u) => u.email?.toLowerCase() === params.email.toLowerCase()
        );
        if (existing) {
          await adminClient.auth.admin.updateUserById(existing.id, {
            password: params.password,
            email_confirm: true,
            user_metadata: {
              ...existing.user_metadata,
              full_name: params.fullName,
              phone: params.phone,
              dob: params.dob,
              gender: params.gender,
              blood_group: params.bloodGroup,
            },
          });
          revalidatePath('/', 'layout');
          return { success: true, user: existing };
        }
      }
      return { error: adminError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, user: adminUser.user };
  }

  // Fallback to standard client signUp if adminClient unavailable
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        phone: params.phone,
        role: 'patient',
        dob: params.dob,
        gender: params.gender,
        blood_group: params.bloodGroup,
        address_line: params.address_line,
        city: params.city,
        pincode: params.pincode,
        emergency_contact_name: params.emergency_contact_name,
        emergency_contact_phone: params.emergency_contact_phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true, user: data.user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/signin');
}

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
