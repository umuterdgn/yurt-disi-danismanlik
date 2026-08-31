"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Nexa</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900">Ana Sayfa</Link>
            <Link href="/hakkimizda" className="text-gray-700 hover:text-gray-900">Hakkımızda</Link>
            <Link href="/hizmetlerimiz" className="text-gray-700 hover:text-gray-900">Hizmetlerimiz</Link>
            <Link href="/ulkeler" className="text-gray-700 hover:text-gray-900">Ülkeler</Link>
            <Link href="/iletisim" className="text-gray-700 hover:text-gray-900">İletişim</Link>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Kayıt Ol</Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dialog */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span>Nexa Menü</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <Link
              href="/"
              className="text-lg text-gray-700 hover:text-gray-900 py-2 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ana Sayfa
            </Link>
            <Link
              href="/hakkimizda"
              className="text-lg text-gray-700 hover:text-gray-900 py-2 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hakkımızda
            </Link>
            <Link
              href="/hizmetlerimiz"
              className="text-lg text-gray-700 hover:text-gray-900 py-2 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hizmetlerimiz
            </Link>
            <Link
              href="/ulkeler"
              className="text-lg text-gray-700 hover:text-gray-900 py-2 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ülkeler
            </Link>
            <Link
              href="/iletisim"
              className="text-lg text-gray-700 hover:text-gray-900 py-2 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              İletişim
            </Link>
            <div className="flex flex-col space-y-3 pt-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  Giriş Yap
                </Button>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full">
                  Kayıt Ol
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
