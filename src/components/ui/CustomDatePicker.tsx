'use client'

import React from 'react'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker.css'
import { ru } from 'date-fns/locale'

registerLocale('ru', ru)

interface CustomDatePickerProps {
  value: string // 'YYYY-MM-DD'
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export default function CustomDatePicker({ value, onChange, placeholder, className, required }: CustomDatePickerProps) {
  const selectedDate = value ? new Date(value) : null

  return (
    <ReactDatePicker
      selected={selectedDate}
      onChange={(date: Date | null) => {
        if (!date) {
          onChange('')
        } else {
          // Format as YYYY-MM-DD in local time
          const offset = date.getTimezoneOffset()
          const localDate = new Date(date.getTime() - (offset*60*1000))
          onChange(localDate.toISOString().split('T')[0])
        }
      }}
      dateFormat="dd.MM.yyyy"
      locale="ru"
      placeholderText={placeholder || 'Выберите дату'}
      className={className}
      required={required}
      showPopperArrow={false}
    />
  )
}
