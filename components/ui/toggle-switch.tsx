"use client"

import type React from "react"

// Toggle switch component
type ToggleSwitchProps = {
  label: string
  isChecked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
}

const ToggleSwitch = ({ label, isChecked, onChange, icon }: ToggleSwitchProps) => {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch">
        <input type="checkbox" checked={isChecked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
      <span className="toggle-label">
        {icon}
        {label}
      </span>
    </div>
  )
}

export default ToggleSwitch
