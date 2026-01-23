import { IndicatorCapability } from "@/types/indicatorCapability";

export const SmartMoneyConceptsCapability: IndicatorCapability = {
    id: "smc_pro_v1",
    ui_version: "1.0.0",
    sections: [
        {
            id: "mode_settings",
            title: "Mode Settings",
            description: "Configure how the indicator calculates structure",
            controls: [
                {
                    id: "mode",
                    label: "Analysis Mode",
                    type: "select",
                    bind: "mode",
                    options: [
                        { label: "Historical (Repaint)", value: "historical" },
                        { label: "Realtime (Confirmed Only)", value: "realtime" }
                    ],
                    default: "realtime"
                },
                {
                    id: "swing_length",
                    label: "Swing Structure Length",
                    type: "number",
                    bind: "swingLength",
                    min: 3,
                    max: 50,
                    default: 5
                }
            ]
        },
        {
            id: "internal_structure",
            title: "Internal Structure",
            controls: [
                {
                    id: "show_bos",
                    label: "Show BOS",
                    type: "toggle",
                    bind: "showBos",
                    default: true
                },
                {
                    id: "show_choch",
                    label: "Show CHoCH",
                    type: "toggle",
                    bind: "showChoch",
                    default: true
                },
                {
                    id: "color_bullish",
                    label: "Bullish Color",
                    type: "color",
                    bind: "colorBull",
                    default: "#00FF00"
                }
            ]
        },
        {
            id: "fvg_settings",
            title: "Fair Value Gaps",
            controls: [
                {
                    id: "show_fvg",
                    label: "Enable FVG",
                    type: "toggle",
                    bind: "showFvg",
                    default: true
                },
                {
                    id: "fvg_extend",
                    label: "Extend FVG Box",
                    type: "number",
                    bind: "fvgExtend",
                    min: 0,
                    max: 50,
                    default: 10
                }
            ]
        }
    ]
};
