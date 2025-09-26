"use client"

import type React from "react"
import { useState, useEffect } from "react"

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17-4a4 4 0 01-8 0 4 4 0 018 0zM7 21a4 4 0 01-8 0 4 4 0 018 0z" />
  </svg>
)

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
)

const ContrastIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 000 20V2z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 003.51 15" />
  </svg>
)

export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [contrast, setContrast] = useState<"default" | "bold">("default")
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr")
  const [compact, setCompact] = useState(false)
  const [colorScheme, setColorScheme] = useState<"integrate" | "apparent">("integrate")
  const [fontFamily, setFontFamily] = useState<string>("Inter")
  const [fontSize, setFontSize] = useState<number>(16)

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true" ? "dark" : "light"
    const savedFontFamily = localStorage.getItem("fontFamily") || "Inter"
    const savedFontSize = Number.parseInt(localStorage.getItem("fontSize") || "16")
    const savedDirection = (localStorage.getItem("direction") as "ltr" | "rtl") || "ltr"
    const savedContrast = (localStorage.getItem("contrast") as "default" | "bold") || "default"
    const savedCompact = localStorage.getItem("compact") === "true"
    const savedColorScheme = (localStorage.getItem("colorScheme") as "integrate" | "apparent") || "integrate"

    setMode(savedMode)
    setFontFamily(savedFontFamily)
    setFontSize(savedFontSize)
    setDirection(savedDirection)
    setContrast(savedContrast)
    setCompact(savedCompact)
    setColorScheme(savedColorScheme)

    // Apply settings immediately
    document.documentElement.style.fontFamily = savedFontFamily
    document.documentElement.style.fontSize = `${savedFontSize}px`
    document.documentElement.setAttribute("dir", savedDirection)

    if (savedMode === "dark") {
      document.documentElement.classList.add("dark")
      document.body.style.backgroundColor = "oklch(0.09 0 0)"
      document.body.style.color = "oklch(0.98 0 0)"
    } else {
      document.documentElement.classList.remove("dark")
      document.body.style.backgroundColor = "oklch(1 0 0)"
      document.body.style.color = "oklch(0.09 0 0)"
    }
  }, [])

  const handleToggleDrawer = () => {
    setOpen(!open)
  }

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked ? "dark" : "light"
    setMode(newMode)
    localStorage.setItem("darkMode", newMode === "dark" ? "true" : "false")

    if (newMode === "dark") {
      document.documentElement.classList.add("dark")
      document.body.style.backgroundColor = "oklch(0.09 0 0)"
      document.body.style.color = "oklch(0.98 0 0)"
    } else {
      document.documentElement.classList.remove("dark")
      document.body.style.backgroundColor = "oklch(1 0 0)"
      document.body.style.color = "oklch(0.09 0 0)"
    }
  }

  const handleDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDirection = event.target.checked ? "rtl" : "ltr"
    setDirection(newDirection)
    document.documentElement.setAttribute("dir", newDirection)
    localStorage.setItem("direction", newDirection)
  }

  const handleCompactChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCompact = event.target.checked
    setCompact(newCompact)
    localStorage.setItem("compact", newCompact ? "true" : "false")
  }

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family)
    document.documentElement.style.fontFamily = family
    localStorage.setItem("fontFamily", family)
  }

  const handleColorSchemeChange = (scheme: "integrate" | "apparent") => {
    setColorScheme(scheme)
    localStorage.setItem("colorScheme", scheme)
  }

  const presetColors = [
    { name: "Default", color: "#00AB55" },
    { name: "Cyan", color: "#00B8D4" },
    { name: "Purple", color: "#7635DC" },
    { name: "Blue", color: "#2065D1" },
    { name: "Orange", color: "#FDA92D" },
    { name: "Red", color: "#FF3030" },
  ]

  return (
    <>
      <button
        onClick={handleToggleDrawer}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
        style={{
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
        }}
      >
        <SettingsIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleToggleDrawer} />
          <div className="ml-auto w-full sm:w-96 bg-white dark:bg-slate-800 p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  onClick={() => {
                    // Reset to defaults
                    setMode("light")
                    setFontFamily("Inter")
                    setFontSize(16)
                    setDirection("ltr")
                    setContrast("default")
                    setCompact(false)
                    setColorScheme("integrate")
                    localStorage.clear()
                    window.location.reload()
                  }}
                >
                  <RefreshIcon />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  onClick={handleToggleDrawer}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Mode and Contrast toggles */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-3 flex items-center justify-center mx-auto shadow-lg">
                  {mode === "dark" ? <MoonIcon /> : <SunIcon />}
                </div>
                <p className="text-sm mb-3 font-medium text-gray-700 dark:text-gray-300">Mode</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mode === "dark"}
                    onChange={handleModeChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 text-white mb-3 flex items-center justify-center mx-auto shadow-lg">
                  <ContrastIcon />
                </div>
                <p className="text-sm mb-3 font-medium text-gray-700 dark:text-gray-300">Contrast</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contrast === "bold"}
                    onChange={(e) => setContrast(e.target.checked ? "bold" : "default")}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Direction and Compact toggles */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm mb-3 font-medium text-gray-700 dark:text-gray-300">Right to Left</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={direction === "rtl"}
                    onChange={handleDirectionChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm mb-3 font-medium text-gray-700 dark:text-gray-300">Compact</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={compact} onChange={handleCompactChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Font Family Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Font Family</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Inter", label: "Aa" },
                  { name: "Public Sans", label: "Aa" },
                  { name: "DM Sans", label: "Aa" },
                  { name: "Nunito Sans", label: "Aa" },
                ].map((font) => (
                  <button
                    key={font.name}
                    onClick={() => handleFontFamilyChange(font.name)}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                      fontFamily === font.name
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                    }`}
                  >
                    <div
                      className="text-2xl font-bold mb-2 text-gray-900 dark:text-white"
                      style={{ fontFamily: font.name }}
                    >
                      {font.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{font.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Font Size</h3>
              <div className="relative px-2">
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={fontSize}
                  onChange={(e) => {
                    const size = Number.parseInt(e.target.value)
                    setFontSize(size)
                    document.documentElement.style.fontSize = `${size}px`
                    localStorage.setItem("fontSize", size.toString())
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                />
                <div
                  className="absolute -top-10 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg"
                  style={{ left: `${((fontSize - 12) / 8) * 100}%`, transform: "translateX(-50%)" }}
                >
                  {fontSize}px
                </div>
              </div>
            </div>

            {/* Color Scheme */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Color Scheme</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleColorSchemeChange("integrate")}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                    colorScheme === "integrate"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mx-auto mb-2"></div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Integrate</div>
                </button>
                <button
                  onClick={() => handleColorSchemeChange("apparent")}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                    colorScheme === "apparent"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-400 rounded-lg mx-auto mb-2"></div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Apparent</div>
                </button>
              </div>
            </div>

            {/* Preset Colors */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Presets</h3>
              <div className="grid grid-cols-3 gap-3">
                {presetColors.map((preset) => (
                  <button
                    key={preset.name}
                    className="w-full h-12 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
