import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
    children: React.ReactNode
}

const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
}>({
    open: false,
    setOpen: () => { },
})

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
    const [open, setOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div ref={ref} className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

export const DropdownMenuTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, {
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation()
                setOpen(!open);
                (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props.onClick?.(e)
            }
        })
    }

    return (
        <button onClick={() => setOpen(!open)} type="button">
            {children}
        </button>
    )
}

export const DropdownMenuContent = ({
    children,
    align = "center",
    className
}: {
    children: React.ReactNode
    align?: "start" | "end" | "center"
    className?: string
}) => {
    const { open } = React.useContext(DropdownMenuContext)

    if (!open) return null

    return (
        <div
            className={cn(
                "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                align === "center" && "left-1/2 -translate-x-1/2",
                align === "start" && "left-0",
                align === "end" && "right-0",
                className
            )}
        >
            {children}
        </div>
    )
}

export const DropdownMenuItem = ({
    children,
    className,
    onClick
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}) => {
    const { setOpen } = React.useContext(DropdownMenuContext)

    return (
        <div
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            onClick={(e) => {
                e.stopPropagation()
                onClick?.()
                setOpen(false)
            }}
        >
            {children}
        </div>
    )
}
