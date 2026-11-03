import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'doctor':
      return '/hospital/doctor';
    case 'lab_staff':
      return '/hospital/lab';
    case 'registrar':
      return '/hospital/registrar';
    case 'hospital_admin':
      return '/hospital/admin';
    case 'platform_admin':
      return '/platform-admin/verifications';
    case 'patient':
    default:
      return '/patient/dashboard';
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const role = (user?.app_metadata?.role || user?.user_metadata?.role || 'patient') as string;
      const targetPath = nextParam || getRoleRedirect(role);

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${targetPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${targetPath}`);
      } else {
        return NextResponse.redirect(`${origin}${targetPath}`);
      }
    }
  }

  // Return the user to signin if code exchange failed
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`);
}
