import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export function ThemeDebugger() {
    const { theme } = useTheme();
    const [cssVars, setCssVars] = useState<Record<string, string>>({});

    useEffect(() => {
        // Get computed styles for the root element
        const rootStyles = getComputedStyle(document.documentElement);
        const vars = {
            "--background": rootStyles.getPropertyValue("--background"),
            "--foreground": rootStyles.getPropertyValue("--foreground"),
            "--card": rootStyles.getPropertyValue("--card"),
            "--border": rootStyles.getPropertyValue("--border"),
            "Current Theme": theme
        };
        setCssVars(vars);
    }, [theme]);

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-background text-foreground border border-border rounded-lg shadow-lg z-50">
            <h3 className="font-bold mb-2">Theme Debugger</h3>
            <div className="space-y-1 text-xs">
                {Object.entries(cssVars).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className="ml-4">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}