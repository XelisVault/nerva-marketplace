"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CartIcon,
  ChevronLeft,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Store,
  UserIcon,
  X,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth, useIsVendor } from "@/lib/auth";
import { useCartCount } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isVendor = useIsVendor();
  const cartCount = useCartCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Marketplace", icon: Store },
    { href: "/listings", label: "Browse", icon: Package },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="bg-brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white">
                  N
                </span>
                NERVA Market
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                    pathname === link.href && "bg-accent text-accent-foreground",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              {isVendor && (
                <>
                  <Link
                    href="/create-listing"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Listing
                  </Link>
                  <Link
                    href="/vendor/orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Package className="h-4 w-4" />
                    Vendor Orders
                  </Link>
                </>
              )}
              {user && !isVendor && (
                <Link
                  href="/customer/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Package className="h-4 w-4" />
                  Your Orders
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
        >
          <span className="bg-brand-gradient inline-flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold text-white shadow-sm">
            N
          </span>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline">
            NERVA <span className="text-brand-gradient">Market</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === link.href && "bg-accent text-accent-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative"
            aria-label={`Cart, ${cartCount} items`}
          >
            <Link href="/cart">
              <CartIcon className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="bg-primary text-primary-foreground absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 pl-1.5 pr-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-white">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isVendor ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/create-listing" className="cursor-pointer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Listing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/vendor/orders" className="cursor-pointer">
                        <Package className="mr-2 h-4 w-4" />
                        Vendor Orders
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/customer/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Your Orders
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1">
              <Link href="/login">
                <UserIcon className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
      <Link href={fallback}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back
      </Link>
    </Button>
  );
}

export function MobileNavClose({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Close menu"
      className="absolute right-3 top-3"
    >
      <X className="h-5 w-5" />
    </Button>
  );
}
