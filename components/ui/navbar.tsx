'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Menu, Snowflake } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  isDateLoading?: boolean;
}

const navLinks = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
];

export function Navbar({ activeTab, onTabChange, dateRange, onDateChange, isDateLoading }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
          <div className="md:hidden">
            <Popover open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48 p-2">
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.id}
                        onClick={() => {
                          onTabChange(link.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          activeTab === link.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </button>
                    );
                  })}
                </nav>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-500 text-white">
              <Snowflake className="h-5 w-5" />
            </div>
            <span className="font-semibold text-xl text-slate-900 hidden sm:inline-block">
              Customer 360
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                    activeTab === link.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'dashboard' && (
            <DateRangePicker date={dateRange} onDateChange={onDateChange} isLoading={isDateLoading} />
          )}
        </div>
      </div>
    </header>
  );
}
