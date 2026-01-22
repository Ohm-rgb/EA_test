import { IndicatorCapability } from "@/types/indicatorCapability";

export const SmartMoneyConceptsCapability: IndicatorCapability = {
    id: "smc_luxalgo",
    name: "Smart Money Concepts",
    version: "1.0.0",
    sections: [
        {
            id: "mode_settings",
            title: "Mode Settings",
            controls: [
                {
                    id: "mode",
                    label: "Calculation Mode",
                    type: "select",
                    defaultValue: "historical",
                    description: "Choose between Historical (faster) or Realtime (updates on every tick)",
                    options: [
                        { label: "Historical", value: "historical" },
                        { label: "Realtime", value: "realtime" }
                    ]
                }
            ]
        },
        {
            id: "internal_structure",
            title: "Internal Structure",
            description: "Configure Break of Structure (BOS) and Change of Character (CHoCH)",
            controls: [
                {
                    id: "show_internal",
                    label: "Show Internal Structure",
                    type: "toggle",
                    defaultValue: true
                },
                {
                    id: "bos_bull",
                    label: "BOS Bullish Signal",
                    type: "signal",
                    actionMap: { onTrigger: "Buy" },
                    visibleWhen: { controlId: "show_internal", equals: true }
                },
                {
                    id: "bos_bear",
                    label: "BOS Bearish Signal",
                    type: "signal",
                    actionMap: { onTrigger: "Sell" },
                    visibleWhen: { controlId: "show_internal", equals: true }
                }
            ]
        },
        {
            id: "fvg",
            title: "Fair Value Gaps",
            controls: [
                {
                    id: "enable_fvg",
                    label: "Enable FVG",
                    type: "toggle",
                    defaultValue: true
                },
                {
                    id: "extend_fvg",
                    label: "Extend FVG",
                    type: "number",
                    defaultValue: 5,
                    min: 1,
                    max: 50,
                    visibleWhen: { controlId: "enable_fvg", equals: true }
                }
            ]
        },
        {
            id: "zones",
            title: "Premium / Discount Zones",
            controls: [
                {
                    id: "show_pd_zones",
                    label: "Show Zones",
                    type: "toggle",
                    defaultValue: false
                },
                {
                    id: "zone_color",
                    label: "Zone Color",
                    type: "color",
                    defaultValue: "#3b82f6",
                    visibleWhen: { controlId: "show_pd_zones", equals: true }
                }
            ]
        }
    ]
};
