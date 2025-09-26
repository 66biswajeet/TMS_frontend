'use client'

import { useCallback } from 'react'
import { Settings, RotateCcw, Type, AlignLeft, AlignRight, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { useSettingsContext } from './use-settings-context'
import type { SettingsDrawerProps } from './types'

// ----------------------------------------------------------------------

export function SettingsDrawer({ defaultSettings }: SettingsDrawerProps) {
  const settings = useSettingsContext()

  const handleReset = useCallback(() => {
    settings.onReset()
  }, [settings])

  return (
    <Sheet open={settings.openDrawer} onOpenChange={settings.onCloseDrawer}>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b">
          <SheetTitle className="flex items-center gap-3 text-xl font-semibold">
            <Settings className="h-6 w-6" />
            Settings
          </SheetTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!settings.canReset}
              className="h-9 px-3 text-sm"
            >
              <Badge
                variant={settings.canReset ? 'destructive' : 'secondary'}
                className="absolute -top-1 -right-1 h-2 w-2 p-0"
                style={{ display: settings.canReset ? 'block' : 'none' }}
              />
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-8 py-6">
          {/* Direction Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
            <div className="flex gap-4">
              <Button
                variant={settings.state.direction === 'rtl' ? 'default' : 'outline'}
                className="flex items-center gap-3 h-14 text-base flex-1"
                onClick={() => settings.setField('direction', settings.state.direction === 'ltr' ? 'rtl' : 'ltr')}
              >
                {settings.state.direction === 'rtl' ? <AlignRight className="h-5 w-5" /> : <AlignLeft className="h-5 w-5" />}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{settings.state.direction === 'rtl' ? 'RTL' : 'LTR'}</span>
                  <span className="text-xs opacity-70">{settings.state.direction === 'rtl' ? 'Right to left' : 'Left to right'}</span>
                </div>
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Navigation Settings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h3>
              {settings.state.navLayout !== defaultSettings.navLayout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => settings.setField('navLayout', defaultSettings.navLayout)}
                  className="h-8 px-3 text-sm"
                >
                  Reset Layout
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Layout Style</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(['vertical', 'horizontal', 'mini'] as const).map((layout) => (
                    <Button
                      key={layout}
                      variant={settings.state.navLayout === layout ? 'default' : 'outline'}
                      className="h-20 text-sm flex flex-col items-center justify-center gap-2 p-3"
                      onClick={() => settings.setField('navLayout', layout)}
                    >
                      <div className="w-10 h-8 border-2 rounded flex items-center justify-center bg-background">
                        {layout === 'vertical' && <div className="w-2 h-5 bg-current rounded-sm" />}
                        {layout === 'horizontal' && <div className="w-6 h-2 bg-current rounded-sm" />}
                        {layout === 'mini' && <div className="w-1 h-5 bg-current rounded-sm" />}
                      </div>
                      <span className="font-medium">{layout.charAt(0).toUpperCase() + layout.slice(1)}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Navigation Color */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">Navigation Color</h4>
              {settings.state.navColor !== defaultSettings.navColor && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => settings.setField('navColor', defaultSettings.navColor)}
                  className="h-8 px-3 text-sm"
                >
                  Reset
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(['integrate', 'apparent'] as const).map((color) => (
                <Button
                  key={color}
                  variant={settings.state.navColor === color ? 'default' : 'outline'}
                  className="h-16 flex flex-col items-center justify-center gap-2 p-3"
                  onClick={() => settings.setField('navColor', color)}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 ${color === 'integrate' ? 'bg-current opacity-50' : 'bg-current'}`} />
                  <span className="font-medium text-sm">{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Font Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
              <Type className="h-5 w-5" />
              Typography
            </h3>
            
            {/* Font Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-700 dark:text-gray-300">Font Size</span>
                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {settings.state.fontSize}px
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={[settings.state.fontSize || 16]}
                  onValueChange={([value]) => settings.setField('fontSize', value)}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Small (12px)</span>
                  <span>Large (20px)</span>
                </div>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-4">
              <span className="text-base font-medium text-gray-700 dark:text-gray-300">Font Family</span>
              <div className="grid grid-cols-1 gap-3">
                {[
                  'Inter, system-ui, sans-serif',
                  'Roboto, sans-serif',
                  'Open Sans, sans-serif',
                  'Lato, sans-serif',
                  'Montserrat, sans-serif',
                  'Source Sans Pro, sans-serif',
                  'Nunito, sans-serif',
                  'Poppins, sans-serif',
                  'Ubuntu, sans-serif',
                  'Merriweather, serif',
                  'Georgia, serif',
                  'Times New Roman, serif',
                  'Monaco, monospace',
                  'Consolas, monospace',
                  'Courier New, monospace',
                  'Arial, sans-serif'
                ].map((font) => {
                  const fontName = font.split(',')[0]
                  return (
                    <Button
                      key={font}
                      variant={settings.state.fontFamily === font ? 'default' : 'outline'}
                      className="h-12 text-sm p-3 justify-between"
                      onClick={() => settings.setField('fontFamily', font)}
                      style={{ fontFamily: font }}
                    >
                      <span className="font-medium">{fontName}</span>
                      <span className="text-xs opacity-70">Aa</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Compact Layout */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="space-y-1">
              <h4 className="text-base font-medium flex items-center gap-3 text-gray-900 dark:text-white">
                <Maximize className="h-5 w-5" />
                Compact Layout
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optimized for large screens (1600px+)
              </p>
            </div>
            <Button
              variant={settings.state.compactLayout ? 'default' : 'outline'}
              size="lg"
              onClick={() => settings.setField('compactLayout', !settings.state.compactLayout)}
              className="min-w-[80px]"
            >
              {settings.state.compactLayout ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}