// proxy.ts — Next.js 16
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — WAJIB dipanggil agar cookie diperbarui
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Halaman publik yang tidak butuh auth
  const isPublicPage =
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon");

  // Halaman yang butuh auth
  const isProtectedPage =
    pathname.startsWith("/cashier") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/";

  // Belum login → ke halaman protected → redirect login
  if (!user && isProtectedPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Hindari redirect loop: jika sudah di /login, jangan redirect lagi
    if (pathname !== "/login") {
      return NextResponse.redirect(loginUrl);
    }
  }

  // Sudah login → akses halaman login atau root → ke cashier
  if (user && (pathname === "/login" || pathname === "/")) {
    const cashierUrl = request.nextUrl.clone();
    cashierUrl.pathname = "/cashier";
    return NextResponse.redirect(cashierUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
