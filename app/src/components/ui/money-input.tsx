
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number
  onChange: (value: string) => void
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.replace(/[^\d]/g, "")

      if (inputValue === "") {
        onChange("")
        return
      }

      const numericValue = parseInt(inputValue, 10)

      // Format for display
      const formatted = (numericValue / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      onChange(formatted)
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          R$
        </span>
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          className={cn("pl-9 text-right", className)}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
MoneyInput.displayName = "MoneyInput"
