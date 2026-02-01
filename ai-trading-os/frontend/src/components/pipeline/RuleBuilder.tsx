import React, { useState } from 'react';
import { useBotStore, LogicRule } from '@/stores/botStore';
import { Trash2, Plus, AlertCircle } from 'lucide-react';

export function RuleBuilder() {
    const { indicatorPool, ruleSets, addRule, removeRule } = useBotStore();

    // Local state for the new rule form
    const [type, setType] = useState<'buy' | 'sell'>('buy');
    const [leftOp, setLeftOp] = useState('');
    const [operator, setOperator] = useState<LogicRule['operator']>('>');
    const [rightOp, setRightOp] = useState<number | string>(0);
    const [rightOpType, setRightOpType] = useState<'value' | 'indicator'>('value');

    const canAdd = leftOp && operator && (rightOp !== '' && rightOp !== null) && indicatorPool.length > 0;

    const handleAdd = () => {
        if (!canAdd) return;
        addRule({
            type,
            leftOperandId: leftOp,
            operator,
            rightOperand: rightOp
        });
        // Reset form slightly but keep context
        setRightOp(0);
    };

    const getIndicatorName = (id: string) => {
        return indicatorPool.find(i => i.id === id)?.name || id;
    };

    // -------------------------------------------------------------------------
    // VALIDATION GUARD: Empty Inventory
    // -------------------------------------------------------------------------
    if (indicatorPool.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-xl">
                <AlertCircle className="w-12 h-12 mb-4 text-amber-500/50" />
                <h3 className="text-lg font-semibold text-slate-400">Inventory Empty</h3>
                <p className="text-sm text-center mt-2 max-w-xs">
                    You need to add Indicators in the <strong>INVENTORY</strong> phase before defining Logic Rules.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Rule Creation Form */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    New Logic Rule
                </h3>

                <div className="flex flex-col gap-4">

                    {/* IF Condition Type */}
                    <div className="w-full">
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Logic Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        >
                            <option value="buy">IF (Buy)</option>
                            <option value="sell">IF (Sell)</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* Left Operand (Indicator) */}
                        <div className="w-full">
                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Left Operand</label>
                            <select
                                value={leftOp}
                                onChange={(e) => setLeftOp(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-blue-500 outline-none"
                            >
                                <option value="">Select Indicator...</option>
                                {indicatorPool.map(ind => (
                                    <option key={ind.id} value={ind.id}>{ind.name} ({ind.indicatorId})</option>
                                ))}
                            </select>
                        </div>

                        {/* Operator */}
                        <div className="w-full">
                            {/* <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Operator</label> */}
                            <select
                                value={operator}
                                onChange={(e) => setOperator(e.target.value as LogicRule['operator'])}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-center text-blue-300 font-mono focus:border-blue-500 outline-none"
                            >
                                <option value=">">&gt; (Greater)</option>
                                <option value="<">&lt; (Less)</option>
                                <option value="==">== (Equal)</option>
                                <option value=">=">&ge; (Greater Eq)</option>
                                <option value="<=">&le; (Less Eq)</option>
                                <option value="crosses_above">Crosses Above</option>
                                <option value="crosses_below">Crosses Below</option>
                            </select>
                        </div>

                        {/* Right Operand */}
                        <div className="w-full flex gap-1">
                            {/* Toggle Value/Indicator */}
                            <button
                                onClick={() => setRightOpType(prev => prev === 'value' ? 'indicator' : 'value')}
                                className="bg-slate-700 text-xs px-2 rounded text-slate-300 hover:bg-slate-600 flex-none"
                                title="Toggle Value/Indicator"
                            >
                                {rightOpType === 'value' ? '#' : 'ƒ'}
                            </button>

                            {rightOpType === 'value' ? (
                                <input
                                    type="number"
                                    value={rightOp}
                                    onChange={(e) => setRightOp(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    placeholder="Value"
                                />
                            ) : (
                                <select
                                    value={rightOp}
                                    onChange={(e) => setRightOp(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select Indicator...</option>
                                    {indicatorPool.map(ind => (
                                        <option key={ind.id} value={ind.id}>{ind.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Add Button */}
                    <div className="w-full mt-2">
                        <button
                            onClick={handleAdd}
                            disabled={!canAdd}
                            className={`
                                w-full flex items-center justify-center py-3 rounded text-xs font-bold uppercase tracking-wide transition-all
                                ${canAdd
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                            `}
                        >
                            Add Rule
                        </button>
                    </div>
                </div>
            </div>

            {/* Rules List Display */}
            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                {/* Buy Rules */}
                <div className="flex flex-col bg-emerald-900/10 border border-emerald-900/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-emerald-900/20 border-b border-emerald-900/30">
                        <h4 className="text-emerald-400 text-sm font-bold uppercase">Buy Signal Rules</h4>
                    </div>
                    <div className="p-4 flex-1 overflow-auto space-y-2">
                        {ruleSets.buy.length === 0 && (
                            <p className="text-xs text-slate-600 text-center italic mt-4">No Buy rules defined.</p>
                        )}
                        {ruleSets.buy.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between bg-slate-900/80 p-3 rounded border border-slate-800 group hover:border-emerald-500/50 transition-colors">
                                <div className="text-sm font-mono text-slate-300">
                                    <span className="text-blue-400">{getIndicatorName(rule.leftOperandId)}</span>
                                    <span className="mx-2 text-slate-500 font-bold">{rule.operator}</span>
                                    <span className="text-amber-400">
                                        {rule.rightOperand.toString().startsWith('inst_')
                                            ? getIndicatorName(rule.rightOperand.toString())
                                            : rule.rightOperand}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeRule(rule.id, 'buy')}
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sell Rules */}
                <div className="flex flex-col bg-rose-900/10 border border-rose-900/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-rose-900/20 border-b border-rose-900/30">
                        <h4 className="text-rose-400 text-sm font-bold uppercase">Sell Signal Rules</h4>
                    </div>
                    <div className="p-4 flex-1 overflow-auto space-y-2">
                        {ruleSets.sell.length === 0 && (
                            <p className="text-xs text-slate-600 text-center italic mt-4">No Sell rules defined.</p>
                        )}
                        {ruleSets.sell.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between bg-slate-900/80 p-3 rounded border border-slate-800 group hover:border-rose-500/50 transition-colors">
                                <div className="text-sm font-mono text-slate-300">
                                    <span className="text-blue-400">{getIndicatorName(rule.leftOperandId)}</span>
                                    <span className="mx-2 text-slate-500 font-bold">{rule.operator}</span>
                                    <span className="text-amber-400">
                                        {rule.rightOperand.toString().startsWith('inst_')
                                            ? getIndicatorName(rule.rightOperand.toString())
                                            : rule.rightOperand}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeRule(rule.id, 'sell')}
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
