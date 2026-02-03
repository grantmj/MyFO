import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const userId = request.cookies.get('user_id')?.value;

    // Protected routes - redirect to login if not authenticated
    const protectedPaths = ['/dashboard', '/transactions', '/income', '/onboarding', '/assistant'];
    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !userId) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users from home/login/register to dashboard
    const authPaths = ['/login', '/register'];
    const isExactHomePath = request.nextUrl.pathname === '/';
    const isAuthPath = authPaths.some(path =>
        request.nextUrl.pathname === path
    );

    if ((isAuthPath || isExactHomePath) && userId) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
