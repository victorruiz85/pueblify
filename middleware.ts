import { NextResponse, type NextRequest } from "next/server";

// Protección mínima: sin sesión solo se permite /login.
export function middleware(req: NextRequest) {
  const tieneSesion = Boolean(req.cookies.get("pueblify_session"));
  const esLogin = req.nextUrl.pathname.startsWith("/login");

  if (!tieneSesion && !esLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (tieneSesion && esLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
