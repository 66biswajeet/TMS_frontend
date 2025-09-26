"use client"

import { useState } from "react"

export function Searchbar() {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="flex items-center">
      {searchOpen ? (
        <input
          autoFocus
          placeholder="Search..."
          onBlur={() => setSearchOpen(false)}
          className="pl-4 pr-2 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
