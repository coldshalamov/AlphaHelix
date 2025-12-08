import React, { useState } from 'react';

const SwapCard = () => {
  const [inputAmount, setInputAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState('YES'); // 'YES' or 'NO'

  // Mock calculation: Input * 0.98 just to show functionality
  const numericInput = parseFloat(inputAmount) || 0;
  const estimatedReceive = numericInput > 0 ? (numericInput * 0.98).toFixed(2) : '0';

  return (
    <div className="w-full max-w-md mx-auto p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border border-slate-700">
      <div className="bg-slate-900 rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Trade Truth</h2>
        </div>

        {/* You Pay Section */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group">
            <div className="flex justify-between mb-2">
                <label className="text-slate-400 text-sm font-medium">You Pay</label>
            </div>
            <div className="flex items-center gap-4">
                <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-3xl font-medium text-white placeholder-slate-600 focus:outline-none"
                />
                <span className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-slate-600">
                    HLX
                </span>
            </div>
        </div>

        {/* Selection Toggle (YES/NO) */}
        <div className="relative bg-slate-800 p-1 rounded-lg flex font-bold">
            <button
                onClick={() => setSelectedSide('YES')}
                className={`flex-1 py-3 rounded-md transition-all duration-300 ${
                    selectedSide === 'YES'
                        ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-cyan-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                YES
            </button>
            <button
                onClick={() => setSelectedSide('NO')}
                className={`flex-1 py-3 rounded-md transition-all duration-300 ${
                    selectedSide === 'NO'
                        ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-cyan-500/50'
                        : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                NO
            </button>
        </div>

        {/* Est. Receive Section */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between mb-2">
                <label className="text-slate-400 text-sm font-medium">Est. Receive</label>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-full text-3xl font-medium text-white">
                    {estimatedReceive}
                </div>
                <span className="text-slate-400 text-sm font-bold">
                    Shares
                </span>
            </div>
        </div>

        {/* Price Impact Label */}
        <div className="flex justify-between items-center text-sm px-2">
            <span className="text-slate-400">Current Odds</span>
            <div className="flex items-center gap-2">
                <span className="text-slate-300">50%</span>
                <span className="text-slate-500">→</span>
                <span className="text-cyan-400 font-bold">52%</span>
            </div>
        </div>

        {/* Action Button */}
        <button
            className="w-full py-4 rounded-xl font-bold text-lg text-slate-900 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-[1.01] active:scale-[0.99]"
        >
            SWAP
        </button>
      </div>
    </div>
  );
};

export default SwapCard;
