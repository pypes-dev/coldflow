'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MailIcon, Key, X } from 'lucide-react'

interface SideNavbarProps {
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

export const SideNavbar: React.FC<SideNavbarProps> = ({
  isMobileMenuOpen = false,
  onCloseMobileMenu
}) => {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
    onCloseMobileMenu?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar - hidden on mobile by default, shows as drawer when open */}
      <aside className={`
        fixed lg:relative
        inset-y-0 left-0
        w-64 bg-background border-r border-border
        h-full flex flex-col
        z-50 lg:z-0
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <span className="text-sm font-semibold">Menu</span>
          <button
            onClick={onCloseMobileMenu}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-hidden flex flex-col min-h-0">
          <button
            onClick={() => handleNavigation('/dashboard/email-accounts')}
            className="w-full px-4 py-2 text-left flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <MailIcon className="w-4 h-4" />
            <span>Email Accounts</span>
          </button>
        </nav>

        {/* API Keys Section */}
        <div className="border-t border-border flex-shrink-0">
          <button
            onClick={() => handleNavigation('/dashboard/settings/api-keys')}
            className="w-full px-4 py-2 text-left flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <Key className="w-4 h-4" />
            <span>API Keys</span>
          </button>
        </div>
      </aside>
    </>
  )
}
