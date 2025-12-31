import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Get all relevant cookies
    const allCookies = {
      user_id: cookieStore.get('user_id')?.value || null,
      user_role: cookieStore.get('user_role')?.value || null,
      'sb-access-token': cookieStore.get('sb-access-token')?.value ? 'exists' : null,
      'sb-refresh-token': cookieStore.get('sb-refresh-token')?.value ? 'exists' : null,
    };
    
    return NextResponse.json({
      cookies: allCookies,
      diagnosis: {
        isAuthenticated: !!allCookies.user_id,
        isOwner: allCookies.user_role === 'owner',
        hasSupabaseTokens: !!(allCookies['sb-access-token'] && allCookies['sb-refresh-token']),
        canAccessFinanceAPI: !!(allCookies.user_id && allCookies.user_role === 'owner')
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check auth', details: error.message },
      { status: 500 }
    );
  }
}

