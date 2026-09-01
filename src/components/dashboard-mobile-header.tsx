"use client";

import { useState } from 'react';
import { Menu, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardMobileHeaderProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
}

export function DashboardMobileHeader({ title, subtitle, onMenuClick }: DashboardMobileHeaderProps) {
  return (
    <div className="flex md:hidden items-center justify-between p-4 border-b bg-white w-full sticky top-0 z-40">
      <div className="flex items-center space-x-2">
        <GraduationCap className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <Button variant="outline" size="icon" onClick={onMenuClick}>
        <Menu className="w-5 h-5" />
      </Button>
    </div>
  );
}
