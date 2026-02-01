import { IndicatorCapability } from "@/types/indicatorCapability";

export const SmartMoneyConceptsCapability: IndicatorCapability = {
    id: 'smc_luxalgo_v2',
    ui_version: '2.0.0', // Major update
    sections: [
        {
            id: 'mode_settings',
            title: 'General Configuration',
            description: 'Set analysis mode and visualization style',
            controls: [
                {
                    id: 'mode',
                    type: 'select',
                    label: 'Analysis Mode',
                    bind: 'mode',
                    default: 'Historical',
                    options: [
                        { value: 'Historical', label: 'Historical (Backtest)' },
                        { value: 'Present', label: 'Real-time (Monitoring)' }
                    ]
                },
                {
                    id: 'style',
                    type: 'select',
                    label: 'Style',
                    bind: 'style',
                    default: 'Colored',
                    options: [
                        { value: 'Colored', label: 'Colored' },
                        { value: 'Monochrome', label: 'Monochrome' }
                    ]
                },
                {
                    id: 'color_candles',
                    type: 'toggle',
                    label: 'Color Candles',
                    bind: 'color_candles',
                    default: false
                }
            ]
        },
        {
            id: 'real_time_internal',
            title: 'Real Time Internal Structure',
            description: 'Short-term market structure (BOS / CHoCH)',
            controls: [
                {
                    id: 'show_internal_structure',
                    type: 'toggle',
                    label: 'Show Internal Structure',
                    bind: 'show_internal_structure',
                    default: true
                },
                {
                    id: 'bullish_structure_color',
                    type: 'color',
                    label: 'Bullish Structure Color',
                    bind: 'bull_struct_col',
                    default: '#089981'
                },
                {
                    id: 'bearish_structure_color',
                    type: 'color',
                    label: 'Bearish Structure Color',
                    bind: 'bear_struct_col',
                    default: '#F23645'
                },
                {
                    id: 'confluence_filter',
                    type: 'toggle',
                    label: 'Confluence Filter',
                    bind: 'confluence_filter',
                    default: false
                },
                {
                    id: 'structure_label_size',
                    type: 'select',
                    label: 'Label Size',
                    bind: 'internal_label_size',
                    default: 'Tiny',
                    options: [
                        { value: 'Tiny', label: 'Tiny' },
                        { value: 'Small', label: 'Small' },
                        { value: 'Normal', label: 'Normal' }
                    ]
                }
            ]
        },
        {
            id: 'real_time_swing',
            title: 'Real Time Swing Structure',
            description: 'Major market structure (Trend Direction)',
            controls: [
                {
                    id: 'show_swing_structure',
                    type: 'toggle',
                    label: 'Show Swing Structure',
                    bind: 'show_swing_structure',
                    default: true
                },
                {
                    id: 'swing_label_size',
                    type: 'select',
                    label: 'Swing Label Size',
                    bind: 'swing_label_size',
                    default: 'Small',
                    options: [
                        { value: 'Small', label: 'Small' },
                        { value: 'Normal', label: 'Normal' }
                    ]
                },
                {
                    id: 'show_swing_points',
                    type: 'number',
                    label: 'Show Swing Points (History)',

                    bind: 'show_swing_points',
                    default: 50,
                    min: 1,
                    max: 500,
                    step: 1
                }
            ]
        },
        {
            id: 'order_blocks',
            title: 'Order Blocks (OB)',
            description: 'Institutional reference points for entry',
            controls: [
                {
                    id: 'show_ib_ob', // Internal Order Blocks
                    type: 'toggle',
                    label: 'Internal Order Blocks',
                    bind: 'show_ib_ob',
                    default: true
                },
                {
                    id: 'ib_ob_count',
                    type: 'number',
                    label: 'Internal OB Count',
                    bind: 'ib_ob_count',
                    default: 5,
                    min: 1,
                    max: 20,
                    step: 1
                },
                {
                    id: 'show_swing_ob',
                    type: 'toggle',
                    label: 'Swing Order Blocks',
                    bind: 'show_swing_ob',
                    default: true
                },
                {
                    id: 'swing_ob_count',
                    type: 'number',
                    label: 'Swing OB Count',
                    bind: 'swing_ob_count',
                    default: 5,
                    min: 1,
                    max: 20,
                    step: 1
                },
                {
                    id: 'ob_mitigation',
                    type: 'select',
                    label: 'Mitigation Method',
                    bind: 'ob_mitigation',
                    default: 'Close',
                    options: [
                        { value: 'High/Low', label: 'High/Low (Wick)' },
                        { value: 'Close', label: 'Close (Body)' }
                    ]
                }
            ]
        },
        {
            id: 'fair_value_gaps',
            title: 'Fair Value Gaps (FVG)',
            description: 'Imbalance detection for magnet targets',
            controls: [
                {
                    id: 'show_fvg',
                    type: 'toggle',
                    label: 'Show FVG',
                    bind: 'show_fvg',
                    default: true
                },
                {
                    id: 'auto_threshold',
                    type: 'toggle',
                    label: 'Auto Threshold',
                    bind: 'fvg_auto_threshold',
                    default: true
                },
                {
                    id: 'fvg_timeframe',
                    type: 'select',
                    label: 'Timeframe',
                    bind: 'fvg_tf',
                    default: 'Chart',
                    options: [
                        { value: 'Chart', label: 'Chart' },
                        { value: '15m', label: '15m' },
                        { value: '1h', label: '1h' },
                        { value: '4h', label: '4h' }
                    ]
                }
            ]
        },
        {
            id: 'premium_discount',
            title: 'Premium & Discount Zones',
            description: 'Equilibrium analysis for Risk/Reward',
            controls: [
                {
                    id: 'show_pd_zones',
                    type: 'toggle',
                    label: 'Show P/D Zones',
                    bind: 'show_pd',
                    default: true
                }
            ]
        }
    ]
};
