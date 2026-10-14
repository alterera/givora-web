import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.get("givora_access") || request.cookies.get("givora_refresh");
  const path = request.nextUrl.pathname;
  if ((path.startsWith("/account") || path.startsWith("/admin")) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin", "/admin/:path*"],
};
