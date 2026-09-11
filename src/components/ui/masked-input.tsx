"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  onlyDigits,
  formatCPF,
  formatPhoneBR,
  centsFromDigits,
  formatCentsToBRL,
} from "@/lib/masks"

type BaseProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">

type CpfInputProps = BaseProps & {
  /** Somente dígitos (sem pontuação) — é o que fica salvo no banco. */
  value: string
  onValueChange: (digits: string) => void
}

function CpfInput({ value, onValueChange, ...props }: CpfInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      value={formatCPF(value)}
      onChange={(e) => onValueChange(onlyDigits(e.target.value).slice(0, 11))}
      placeholder={props.placeholder ?? "000.000.000-00"}
    />
  )
}

type PhoneInputProps = BaseProps & {
  /** Somente dígitos (DDD + número, sem o +55) — convertido para E.164 ao salvar. */
  value: string
  onValueChange: (digits: string) => void
}

function PhoneInput({ value, onValueChange, ...props }: PhoneInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      value={formatPhoneBR(value)}
      onChange={(e) => onValueChange(onlyDigits(e.target.value).slice(0, 11))}
      placeholder={props.placeholder ?? "(11) 91234-5678"}
    />
  )
}

type CurrencyInputProps = BaseProps & {
  /** Valor em centavos (inteiro) — nunca número decimal solto. */
  value: number
  onValueChange: (cents: number) => void
}

function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      className={props.className}
      value={value ? formatCentsToBRL(value) : ""}
      onChange={(e) => onValueChange(centsFromDigits(e.target.value))}
      placeholder={props.placeholder ?? "R$ 0,00"}
    />
  )
}

export { CpfInput, PhoneInput, CurrencyInput }
