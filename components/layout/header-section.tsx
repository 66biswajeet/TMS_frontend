import type React from "react"

export type HeaderSectionProps = {
  className?: string
  slots?: {
    topArea?: React.ReactNode
    leftArea?: React.ReactNode
    rightArea?: React.ReactNode
  }
}

export function HeaderSection({ className, slots }: HeaderSectionProps) {
  return (
    <header className={`fixed top-0 left-0 right-0 bg-background border-b border-border z-50 ${className || ""}`}>
      {slots?.topArea}
      <div className="flex items-center justify-between px-6 h-16">
        {slots?.leftArea}
        <div className="flex-1" />
        {slots?.rightArea}
      </div>
    </header>
  )
}
