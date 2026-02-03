"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Add keyboard shortcut
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                setTheme(theme === "dark" ? "light" : "dark");
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [theme, setTheme]);

    // P2-009: Cycle through light → dark → system
    const handleThemeToggle = () => {
        setIsAnimating(true);
        const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        setTheme(nextTheme);
        setTimeout(() => setIsAnimating(false), 300);
    };

    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 glass-button">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <div className="relative group" data-action="theme-toggle">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleThemeToggle}
                className={cn(
                    "h-9 w-9 p-0 glass-button relative overflow-hidden",
                    isAnimating && "animate-pulse"
                )}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode (Ctrl+T)`}
            >
                {/* Animated background */}
                <div className={cn(
                    "absolute inset-0 transition-all duration-300",
                    theme === "dark" ? "bg-yellow-500/10" : "bg-blue-500/10"
                )} />
                
                {/* Icon with animation */}
                <div className="relative flex items-center justify-center">
                    {theme === "dark" ? (
                        <Sun className={cn(
                            "h-4 w-4 text-yellow-400 transition-all duration-300",
                            isAnimating && "scale-110 rotate-90"
                        )} />
                    ) : theme === "light" ? (
                        <Moon className={cn(
                            "h-4 w-4 text-blue-400 transition-all duration-300",
                            isAnimating && "scale-110 rotate-90"
                        )} />
                    ) : (
                        <Laptop className={cn(
                            "h-4 w-4 text-gray-400 transition-all duration-300",
                            isAnimating && "scale-110"
                        )} />
                    )}
                </div>

                {/* Glow effect */}
                <div className={cn(
                    "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
                    theme === "dark" ? "bg-yellow-500/20 group-hover:opacity-100" : "bg-blue-500/20 group-hover:opacity-100"
                )} />
            </Button>

            {/* Tooltip */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                <span className="text-white/60 ml-1">(Ctrl+T)</span>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45" />
            </div>

            {/* Theme indicator dots */}
            <div className="absolute -top-1 -right-1 flex gap-0.5">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    theme === "light" ? "bg-blue-500" : "bg-gray-500/30"
                )} />
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    theme === "dark" ? "bg-yellow-500" : "bg-gray-500/30"
                )} />
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    theme === "system" ? "bg-purple-500" : "bg-gray-500/30"
                )} />
            </div>
        </div>
    );
}
