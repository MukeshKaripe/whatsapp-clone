import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// import { Moon, Sun } from "lucide-react"
// import { ThemeProviderContext, useTheme } from "./theme-provider"
// import { useContext } from "react"

// export function ThemeToggle() {
//     const { theme, setTheme } = useTheme()
//     const ThemeInsert = useContext(ThemeProviderContext)
//     console.log(ThemeInsert, 'console value theme');
//     console.log(theme, "theme");


//     return (
//         <button
//             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
//             className="p-2 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground transition-colors"
//             aria-label="Toggle theme"
//         >
//             {theme === 'dark' ? (
//                 <Moon className="h-[1.2rem] w-[1.2rem]" />
//             ) : (
//                 <Sun className="h-[1.2rem] w-[1.2rem]" />
//             )}
//         </button>
//     )
// }