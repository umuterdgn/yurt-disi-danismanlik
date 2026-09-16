"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif font-extrabold text-2xl tracking-wide text-primary">ATA</span>
                  <span className="font-light text-xl tracking-widest text-primary/80">VISION</span>
                </div>
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase mt-1">Eğitim Danışmanlığı</span>
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
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Fixed position, opens from left */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          {/* Menu - Opens from left */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden flex flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                <div className="flex items-baseline gap-1">
                  <span className="font-serif font-extrabold text-lg tracking-wide text-primary">ATA</span>
                  <span className="font-light text-base tracking-widest text-primary/80">VISION</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <Link
                href="/"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                Ana Sayfa
              </Link>
              <Link
                href="/hakkimizda"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                Hakkımızda
              </Link>
              <Link
                href="/hizmetlerimiz"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                Hizmetlerimiz
              </Link>
              <Link
                href="/ulkeler"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                Ülkeler
              </Link>
              <Link
                href="/iletisim"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                İletişim
              </Link>
            </div>
            <div className="p-4 border-t space-y-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  Giriş Yap
                </Button>
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
              >
                <Button className="w-full">
                  Kayıt Ol
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
