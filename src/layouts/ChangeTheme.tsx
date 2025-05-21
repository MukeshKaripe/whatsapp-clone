import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeShowcase() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Theme Showcase</h2>

            <div className="p-4 bg-background border border-border rounded-lg mb-4">
                <p className="text-foreground mb-2">Current theme: <strong>{theme}</strong></p>
                <div className="flex gap-2">
                    <Button
                        variant={theme === "light" ? "default" : "outline"}
                        onClick={() => setTheme("light")}
                        className="flex items-center gap-2"
                    >
                        <Sun size={16} />
                        Light
                    </Button>
                    <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        onClick={() => setTheme("dark")}
                        className="flex items-center gap-2"
                    >
                        <Moon size={16} />
                        Dark
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-card text-card-foreground border border-border rounded-lg">
                    <h3 className="font-medium mb-2">Card Component</h3>
                    <p className="text-sm">This uses bg-card and text-card-foreground</p>
                </div>

                <div className="p-4 bg-muted text-muted-foreground border border-border rounded-lg">
                    <h3 className="font-medium mb-2">Muted Component</h3>
                    <p className="text-sm">This uses bg-muted and text-muted-foreground</p>
                </div>

                <div className="p-4 bg-accent text-accent-foreground border border-border rounded-lg">
                    <h3 className="font-medium mb-2">Accent Component</h3>
                    <p className="text-sm">This uses bg-accent and text-accent-foreground</p>
                </div>
            </div>
        </div>
    );
}