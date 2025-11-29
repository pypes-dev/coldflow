'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-6 items-center">
      <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
        Docs
      </Link>
      <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
        GitHub
      </Link>
      <Link href="/admin" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
        Get Started
      </Link>
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
    </nav>
  )
}
