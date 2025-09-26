"use client"

import type React from "react"
import { Scrollbar } from "../scrollbar/scrollbar"
import { NavSection } from "../nav-section/nav-section"
import { Iconify } from "../iconify/iconify"
import Image from "next/image"

export type NavVerticalProps = {
  data: any[]
  isNavMini: boolean
  onToggleNav: () => void
  slots?: {
    topArea?: React.ReactNode
    bottomArea?: React.ReactNode
  }
}

export function NavVertical({ data, slots, isNavMini, onToggleNav }: NavVerticalProps) {
  return (
    <div
      className={`
      fixed top-0 left-0 h-full flex flex-col z-50
      sidebar-enhanced
      transition-all duration-300 ease-in-out
      ${isNavMini ? "w-16" : "w-64"}
    `}
    >
      {slots?.topArea ?? (
        <div
          className={`
          relative flex items-center justify-center
          ${isNavMini ? "px-2 py-4" : "px-6 py-6"}
          transition-all duration-300 ease-in-out
          border-b border-sidebar-border/50
        `}
        >
          <div className="flex items-center justify-center transition-all duration-300 ease-in-out">
            {isNavMini ? (
              <div
                className="
                w-10 h-10 rounded-xl flex items-center justify-center
                bg-gradient-to-br from-primary to-secondary
                shadow-lg shadow-primary/20
                hover:shadow-xl hover:shadow-primary/30
                transition-all duration-200 ease-out
                cursor-pointer
              "
                onClick={onToggleNav}
              >
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
            ) : (
              <div
                className="cursor-pointer transition-all duration-200 ease-out hover:scale-105"
                onClick={onToggleNav}
              >
                <Image
                  src="/marina-pharmacy-logo.webp"
                  alt="Marina Pharmacy"
                  width={200}
                  height={45}
                  className="object-contain max-w-full h-auto"
                />
              </div>
            )}
          </div>

          {!isNavMini && (
            <button
              onClick={onToggleNav}
              className="
                absolute -right-3 top-1/2 -translate-y-1/2
                w-6 h-6 rounded-full
                bg-sidebar border border-sidebar-border
                shadow-md hover:shadow-lg
                flex items-center justify-center
                transition-all duration-200 ease-out
                hover:bg-sidebar-accent hover:scale-110
                z-10 group
              "
            >
              <Iconify
                icon="solar:alt-arrow-left-linear"
                className="w-3 h-3 text-sidebar-foreground group-hover:text-sidebar-accent-foreground transition-colors duration-200"
              />
            </button>
          )}
        </div>
      )}

      <Scrollbar
        className={`
        flex-1 overflow-y-auto pb-4
        ${isNavMini ? "px-2" : "px-4"}
        transition-all duration-300 ease-in-out
      `}
      >
        <div className="py-4">
          <NavSection data={data} isNavMini={isNavMini} />
        </div>
      </Scrollbar>

      {slots?.bottomArea}
    </div>
  )
}
