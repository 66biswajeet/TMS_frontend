"use client"

import { useCallback, useState } from "react"

// ----------------------------------------------------------------------

export type UseBooleanReturn = {
  value: boolean
  onTrue: () => void
  onFalse: () => void
  onToggle: () => void
  setValue: (newValue: boolean) => void
}

export function useBoolean(defaultValue?: boolean): UseBooleanReturn {
  const [value, setValue] = useState(!!defaultValue)

  const onTrue = useCallback(() => {
    setValue(true)
  }, [])

  const onFalse = useCallback(() => {
    setValue(false)
  }, [])

  const onToggle = useCallback(() => {
    setValue((prev) => !prev)
  }, [])

  return {
    value,
    onTrue,
    onFalse,
    onToggle,
    setValue,
  }
}
