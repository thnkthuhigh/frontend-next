"use client";

import { useState } from "react";
import { useDocumentStore, MARGIN_PRESETS, type MarginPreset, type PageMargins } from "@/store/document-store";
import { Layout, ChevronDown } from "lucide-react";

interface MarginInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

function MarginInput({ label, value, onChange, min = 0, max = 100 }: MarginInputProps) {
    const [localValue, setLocalValue] = useState(value.toFixed(1));

    const handleBlur = () => {
        const num = parseFloat(localValue);
        if (!isNaN(num) && num >= min && num <= max) {
            onChange(num);
        } else {
            setLocalValue(value.toFixed(1));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground font-medium">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                    className="w-full px-3 py-2 pr-8 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mm</span>
            </div>
        </div>
    );
}

const PRESET_LABELS: Record<MarginPreset, string> = {
    normal: "Normal (1 inch)",
    narrow: "Narrow (0.5 inch)",
    wide: "Wide (2 inch sides)",
    custom: "Custom",
};

export function PageSetup() {
    const { margins, marginPreset, setMargins, setMarginPreset } = useDocumentStore();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleMarginChange = (key: keyof PageMargins, value: number) => {
        setMargins({ ...margins, [key]: value });
    };

    const handlePresetChange = (preset: MarginPreset) => {
        if (preset !== "custom") {
            setMarginPreset(preset);
        }
    };

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Layout size={16} className="text-primary" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold">Page Setup</h3>
                        <p className="text-xs text-muted-foreground">
                            {PRESET_LABELS[marginPreset]} margins
                        </p>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    {/* Presets */}
                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-medium">Margin Preset</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["normal", "narrow", "wide"] as MarginPreset[]).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetChange(preset)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                                        marginPreset === preset
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background border-border hover:bg-muted/50'
                                    }`}
                                >
                                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4-Corner Margin Inputs */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-muted-foreground font-medium">Custom Margins</label>
                            {marginPreset === "custom" && (
                                <span className="text-xs text-primary font-medium">Active</span>
                            )}
                        </div>
                        
                        {/* Visual margin layout */}
                        <div className="relative bg-muted/30 rounded-lg p-4">
                            {/* Top margin */}
                            <div className="flex justify-center mb-3">
                                <div className="w-24">
                                    <MarginInput
                                        label="Top"
                                        value={margins.top}
                                        onChange={(v) => handleMarginChange('top', v)}
                                    />
                                </div>
                            </div>

                            {/* Left - Page Visual - Right */}
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-24">
                                    <MarginInput
                                        label="Left"
                                        value={margins.left}
                                        onChange={(v) => handleMarginChange('left', v)}
                                    />
                                </div>

                                {/* Page visual */}
                                <div 
                                    className="w-16 h-20 bg-white border border-border rounded shadow-sm flex items-center justify-center"
                                    style={{
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <span className="text-[8px] text-muted-foreground">A4</span>
                                </div>

                                <div className="w-24">
                                    <MarginInput
                                        label="Right"
                                        value={margins.right}
                                        onChange={(v) => handleMarginChange('right', v)}
                                    />
                                </div>
                            </div>

                            {/* Bottom margin */}
                            <div className="flex justify-center mt-3">
                                <div className="w-24">
                                    <MarginInput
                                        label="Bottom"
                                        value={margins.bottom}
                                        onChange={(v) => handleMarginChange('bottom', v)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info text */}
                        <p className="text-xs text-muted-foreground text-center">
                            Content area: {(210 - margins.left - margins.right).toFixed(1)}mm × {(297 - margins.top - margins.bottom).toFixed(1)}mm
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PageSetup;
