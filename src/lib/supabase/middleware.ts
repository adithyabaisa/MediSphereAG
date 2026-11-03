import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    !url.includes('placeholder') &&
    !key.includes('your-supabase') &&
    !key.includes('your-anon-key')
  );
}

function getAuthorizedHomeForRole(role: string): string {
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

function isPathAllowedForRole(pathname: string, role: string): boolean {
  if (role === 'patient') {
    return pathname.startsWith('/patient');
  }
  if (role === 'doctor') {
    return pathname.startsWith('/hospital/doctor');
  }
  if (role === 'lab_staff') {
    return pathname.startsWith('/hospital/lab');
  }
  if (role === 'registrar') {
    return pathname.startsWith('/hospital/registrar');
  }
  if (role === 'hospital_admin') {
    return pathname.startsWith('/hospital/admin');
  }
  if (role === 'platform_admin') {
    return pathname.startsWith('/platform-admin');
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isConfigured()) {
    // Supabase credentials not yet supplied in .env.local; allow local development & mock mode
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() instead of getSession() to securely validate with the Supabase Auth server.
  // Do not place asynchronous code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const isProtectedRoute =
    pathname.startsWith('/patient') ||
    pathname.startsWith('/hospital') ||
    pathname.startsWith('/platform-admin');

  const isAuthRoute =
    pathname === '/signin' ||
    pathname.startsWith('/register');

  // 1. Unauthenticated users trying to access protected routes -> redirect to /signin
  if (!user && isProtectedRoute) {
    url.pathname = '/signin';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated users trying to access auth pages (/signin, /register) -> redirect to authorized portal
  if (user && isAuthRoute) {
    const role = (user.app_metadata?.role || user.user_metadata?.role || 'patient') as string;
    url.pathname = getAuthorizedHomeForRole(role);
    url.search = '';
    return NextResponse.redirect(url);
  }

  // 3. Role-based Route Guard (enforce strict boundary between patient, clinician, lab, registrar, admin)
  if (user && isProtectedRoute) {
    const role = (user.app_metadata?.role || user.user_metadata?.role || 'patient') as string;

    if (!isPathAllowedForRole(pathname, role)) {
      url.pathname = getAuthorizedHomeForRole(role);
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
