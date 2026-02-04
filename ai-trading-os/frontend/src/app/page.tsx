'use client';

import { useState, useEffect } from 'react';
import { Pause, Square, RotateCcw, XCircle } from 'lucide-react';
import api, { PortfolioOverview, ExposureInfo } from '@/lib/api';
import AIControlPanel from '@/components/dashboard/AIControlPanel';

// Portfolio Metrics Component - Real-time from MT5
function PortfolioMetrics() {
  const [data, setData] = useState<PortfolioOverview | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overview = await api.getPortfolioOverview();
        setData(overview);
      } catch (e) {
        console.error('Failed to fetch portfolio:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="metrics-grid">
      <div className={`metric-card ${(data?.daily_pnl_percent ?? 0) < 0 ? 'negative' : ''}`}>
        <span className="metric-label">MAX DRAWDOWN</span>
        <span className="metric-value">{data ? `${data.daily_pnl_percent >= 0 ? '' : ''}${data.daily_pnl_percent}%` : '...'}</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">MARGIN USED</span>
        <span className="metric-value">{data ? `$${data.margin_used.toLocaleString()}` : '...'}</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">FREE MARGIN</span>
        <span className="metric-value">{data ? `$${data.free_margin.toLocaleString()}` : '...'}</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">TOTAL P/L</span>
        <span className={`metric-value ${(data?.total_pnl ?? 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}`}>
          {data ? `${data.total_pnl >= 0 ? '+' : ''}$${data.total_pnl.toLocaleString()}` : '...'}
        </span>
      </div>
    </div>
  );
}

// Recent Trades Table
function RecentTrades() {
  const trades = [
    { time: '14:30', type: 'BUY', entry: 239.50, exit: 239.50, pl: 0.30 },
    { time: '14:30', type: 'BUY', entry: 239.25, exit: 239.75, pl: 0.40 },
    { time: '14:30', type: 'SELL', entry: 238.60, exit: 238.60, pl: -0.20 },
    { time: '14:30', type: 'BUY', entry: 239.50, exit: 239.50, pl: 1.50 },
    { time: '14:30', type: 'SELL', entry: 239.00, exit: 239.00, pl: 1.40 },
    { time: '14:30', type: 'BUY', entry: 239.20, exit: 239.20, pl: 1.25 },
    { time: '14:30', type: 'BUY', entry: 233.65, exit: 233.65, pl: -0.10 },
  ];

  return (
    <div className="trades-section">
      <h3 className="section-title">Recent Trades</h3>
      <table className="trades-table">
        <thead>
          <tr>
            <th>TIME</th>
            <th>TYPE</th>
            <th>ENTRY</th>
            <th>EXIT</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => (
            <tr key={i}>
              <td>{trade.time}</td>
              <td className={trade.type === 'BUY' ? 'text-[var(--color-info)]' : 'text-[var(--color-critical)]'}>{trade.type}</td>
              <td>{trade.entry.toFixed(2)}</td>
              <td>{trade.exit.toFixed(2)}</td>
              <td className={trade.pl >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}>
                {trade.pl >= 0 ? '+' : ''}{trade.pl.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Chart Area Component
function ChartArea() {
  const [source, setSource] = useState<'tradingview' | 'mt5'>('tradingview');

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h3 className="section-title">Visual Chart Area</h3>
        <div className="source-toggle">
          <button
            className={`toggle-btn ${source === 'tradingview' ? 'active' : ''}`}
            onClick={() => setSource('tradingview')}
          >
            TradingView
          </button>
          <button
            className={`toggle-btn ${source === 'mt5' ? 'active' : ''}`}
            onClick={() => setSource('mt5')}
          >
            MT5
          </button>
        </div>
      </div>
      <div className="chart-placeholder">
        <svg viewBox="0 0 400 150" className="chart-svg">
          <polyline
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            points="0,120 50,100 100,110 150,80 200,90 250,60 300,70 350,40 400,50"
          />
          <polyline
            fill="url(#gradient)"
            stroke="none"
            points="0,150 0,120 50,100 100,110 150,80 200,90 250,60 300,70 350,40 400,50 400,150"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Active Orders Component
function ActiveOrders() {
  const orders = [
    { type: 'BUY', entry: 1467.55, pl: 1240 },
    { type: 'BUY', entry: 1467.73, pl: 1240 },
    { type: 'BUY', entry: 1467.73, pl: 1240 },
    { type: 'BUY', entry: 1461.80, pl: 1240 },
    { type: 'BUY', entry: 1467.39, pl: 1240 },
    { type: 'BUY', entry: 1467.79, pl: -650 },
    { type: 'BUY', entry: 1461.89, pl: 1240 },
  ];

  return (
    <div className="orders-section">
      <h3 className="section-title">Active Orders</h3>
      <table className="orders-table">
        <thead>
          <tr>
            <th>TYPE</th>
            <th>ENTRY</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr key={i}>
              <td className="text-[var(--color-info)]">{order.type}</td>
              <td>{order.entry.toFixed(2)}</td>
              <td className={order.pl >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}>
                {order.pl >= 0 ? '+' : ''}${Math.abs(order.pl).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Control Panel Component
function ControlPanel() {
  const [mt5Connected, setMt5Connected] = useState(true);
  const [aiLocalActive, setAiLocalActive] = useState(true);
  const [aiCloudActive, setAiCloudActive] = useState(false);
  const [autoTrading, setAutoTrading] = useState(true);
  const [riskLevel, setRiskLevel] = useState<'low' | 'mid' | 'high'>('mid');
  const [accountData, setAccountData] = useState<PortfolioOverview | null>(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const data = await api.getPortfolioOverview();
        setAccountData(data);
        setMt5Connected(data.balance > 0); // Assume connected if balance > 0
      } catch (e) {
        console.error('Failed to fetch account data:', e);
        setMt5Connected(false);
      }
    };

    fetchAccountData();
    const interval = setInterval(fetchAccountData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="control-panel">
      {/* Connection Status - All in one row */}
      <div className="connection-status-row">
        {/* MT5 */}
        <div className="status-item">
          <span className="status-label">MT5</span>
          <button
            className={`mini-toggle ${mt5Connected ? 'on' : ''}`}
            onClick={() => setMt5Connected(!mt5Connected)}
          >
            <span className="mini-toggle-slider" />
          </button>
        </div>

        {/* Divider */}
        <div className="status-divider" />

        {/* AI Local */}
        <div className="status-item">
          <span className="status-label">AI Local</span>
          <span className={`glow-dot ${aiLocalActive ? 'active' : ''}`} />
        </div>

        {/* AI Cloud */}
        <div className="status-item">
          <span className="status-label">AI Cloud</span>
          <span className={`glow-dot ${aiCloudActive ? 'active' : ''}`} />
        </div>
      </div>

      {/* Account Stats - Real-time from MT5 */}
      <div className="stats-section">
        <h4 className="stats-title">Account Stats {accountData ? '🟢' : '⏳'}</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">BALANCE</span>
            <span className="stat-value">
              {accountData ? `$${accountData.balance.toLocaleString()}` : '...'}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">EQUITY</span>
            <span className="stat-value highlight">
              {accountData ? `$${accountData.equity.toLocaleString()}` : '...'}
            </span>
            {accountData && (
              <span className={`stat-change ${accountData.total_pnl >= 0 ? '' : 'negative'}`}>
                {accountData.total_pnl >= 0 ? '+' : ''}${accountData.total_pnl.toLocaleString()}
              </span>
            )}
          </div>
          <div className="stat-card">
            <span className="stat-label">DAILY P/L</span>
            <span className={`stat-value ${(accountData?.daily_pnl ?? 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}`}>
              {accountData ? `${accountData.daily_pnl >= 0 ? '+' : ''}$${accountData.daily_pnl.toLocaleString()}` : '...'}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">PROFIT %</span>
            <span className={`stat-value ${(accountData?.daily_pnl_percent ?? 0) >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-critical)]'}`}>
              {accountData ? `${accountData.daily_pnl_percent >= 0 ? '+' : ''}${accountData.daily_pnl_percent}%` : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* EA Controls */}
      <div className="ea-controls">
        <h4 className="controls-title">EA Controls</h4>
        <div className="auto-trading-toggle">
          <span>AUTO-TRADING</span>
          <button
            className={`toggle-switch ${autoTrading ? 'on' : ''}`}
            onClick={() => setAutoTrading(!autoTrading)}
          >
            <span className="toggle-label">{autoTrading ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* AI Performance */}
      <div className="performance-section">
        <h4 className="performance-title">AI Performance Today</h4>
        <div className="performance-grid">
          <div className="perf-item">
            <span className="perf-label">ORDERS</span>
            <span className="perf-value">15</span>
          </div>
          <div className="perf-item">
            <span className="perf-label">WIN RATE</span>
            <span className="perf-value">73%</span>
          </div>
          <div className="perf-item">
            <span className="perf-label">CAP P/L</span>
            <span className="perf-value text-[var(--color-success)]">+$1,240</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4 className="actions-title">Quick Action</h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20 transition-all">
            <Pause size={20} />
            <span className="text-xs font-bold tracking-wider">PAUSE</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-critical)]/10 border border-[var(--color-critical)]/20 text-[var(--color-critical)] hover:bg-[var(--color-critical)]/20 transition-all">
            <Square size={20} fill="currentColor" />
            <span className="text-xs font-bold tracking-wider">STOP ALL</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 text-[var(--color-info)] hover:bg-[var(--color-info)]/20 transition-all">
            <RotateCcw size={20} />
            <span className="text-xs font-bold tracking-wider">RESTART</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[#64748b]/10 border border-[#64748b]/20 text-[#94a3b8] hover:bg-[#64748b]/20 hover:text-white transition-all">
            <XCircle size={20} />
            <span className="text-xs font-bold tracking-wider uppercase">Close All</span>
          </button>
        </div>
      </div>

      {/* Risk Management */}
      <div className="risk-management">
        <h4 className="risk-title">Risk Management</h4>
        <div className="risk-buttons">
          <button
            className={`risk-btn ${riskLevel === 'low' ? 'active' : ''}`}
            onClick={() => setRiskLevel('low')}
          >
            low
          </button>
          <button
            className={`risk-btn ${riskLevel === 'mid' ? 'active' : ''}`}
            onClick={() => setRiskLevel('mid')}
          >
            mid
          </button>
          <button
            className={`risk-btn ${riskLevel === 'high' ? 'active' : ''}`}
            onClick={() => setRiskLevel('high')}
          >
            High
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="logs-section">
        <div className="log-line">System connected. AI active. Order executed at 14:30.</div>
        <div className="log-line">System connected. AI active. Order executed at 14:30.</div>
      </div>
    </div>
  );
}

// Main Dashboard Page
export default function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* Column 1: Portfolio & History */}
      <div className="dashboard-column col-1">
        <div className="column-header">
          <h2>Portfolio & History</h2>
        </div>
        <PortfolioMetrics />
        <RecentTrades />
      </div>

      {/* Column 2: Market Chart & Active Orders */}
      <div className="dashboard-column col-2">
        <div className="column-header">
          <h2>Market Chart & Active Orders</h2>
        </div>
        <ChartArea />
        <ActiveOrders />
      </div>

      {/* Column 3: Control Panel & Status */}
      <div className="dashboard-column col-3">
        <div className="column-header">
          <h2>AI Control & Status</h2>
        </div>
        <AIControlPanel />
        <ControlPanel />
      </div>
    </div>
  );
}
