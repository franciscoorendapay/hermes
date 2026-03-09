
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PercentageInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number
  onChange: (value: string) => void
}

export const PercentageInput = React.forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ className, value, onChange, ...props }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.replace(/[^\d]/g, "")

      // Auto-formatting logic: 1234 -> 12,34
      if (inputValue === "") {
        onChange("")
        return
      }

      // Explicitly handle leading zeros if needed, but for now just parseInt
      const numericValue = parseInt(inputValue, 10)

      // Limit to 10000 (100.00%)
      if (numericValue > 10000) return

      // Format for display
      const formatted = (numericValue / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      onChange(formatted)
    }

    return (
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          className={cn("pr-7 text-right text-sm placeholder:text-xs", className)}
          ref={ref}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          %
        </span>
      </div>
    )
  }
)
PercentageInput.displayName = "PercentageInput"
