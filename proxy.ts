import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && pathname !== "/login" && pathname !== "/signup" && !pathname.startsWith("/api/auth") && !pathname.startsWith("/join/")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
