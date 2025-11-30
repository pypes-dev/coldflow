import clsx from 'clsx'
import React from 'react'
import Image from 'next/image'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { className, loading = 'eager', priority = 'high' } = props

  return (
    <div className={clsx('flex gap-2 items-start', className)}>
      <Image
        src="/ColdflowLogoLong.png"
        alt="coldflow logo"
        width={250}
        height={40}
        loading={loading}
        priority={priority === 'high'}
      />
    </div>
  )
}
