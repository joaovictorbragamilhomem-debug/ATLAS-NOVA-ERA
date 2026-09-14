"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

// Campo de senha com um "olhinho" pra mostrar/esconder o que foi digitado —
// ajuda quem está errando a senha sem perceber (ex.: Caps Lock ligado).
function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
        <span className="sr-only">{visible ? "Esconder senha" : "Mostrar senha"}</span>
      </button>
    </div>
  )
}

export { PasswordInput }
