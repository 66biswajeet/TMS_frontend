/// <reference types="react" />
/// <reference types="react-dom" />

import * as React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
    interface Element {}
  }
}

declare module 'next/link' {
  import { ComponentType, ReactNode } from 'react'
  
  interface LinkProps {
    href: string
    as?: string
    replace?: boolean
    scroll?: boolean
    shallow?: boolean
    prefetch?: boolean
    locale?: string | false
    children?: ReactNode
    className?: string
    onClick?: () => void
  }
  
  const Link: ComponentType<LinkProps>
  export default Link
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void
    replace: (url: string) => void
    back: () => void
    forward: () => void
    refresh: () => void
    pathname: string
    query: any
  }
  
  export function usePathname(): string
  export function useSearchParams(): URLSearchParams
}