'use client';

import { useState } from 'react';

// Portfolio Metrics Component
function PortfolioMetrics() {
  return (
    <div className="metrics-grid">
      <div className="metric-card negative">
        <span className="metric-label">MAX DRAWDOWN</span>
        <span className="metric-value">-3.2%</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">EXPOSURE</span>
        <span className="metric-value">45.5%</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">MARGIN USED</span>
        <span className="metric-value">$12,450</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">RISK/REWARD</span>
        <span className="metric-value">1:2.5</span>
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
              <td className={trade.type === 'BUY' ? 'text-blue' : 'text-red'}>{trade.type}</td>
              <td>{trade.entry.toFixed(2)}</td>
              <td>{trade.exit.toFixed(2)}</td>
              <td className={trade.pl >= 0 ? 'text-green' : 'text-red'}>
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
            stroke="rgba(59, 130, 246, 0.5)"
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
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
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
            <th>NTRY</th>
            <th>P/L</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => (
            <tr key={i}>
              <td className="text-blue">{order.type}</td>
              <td>{order.entry.toFixed(2)}</td>
              <td className={order.pl >= 0 ? 'text-green' : 'text-red'}>
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

      {/* Account Stats */}
      <div className="stats-section">
        <h4 className="stats-title">Account Stats</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">BALANCE</span>
            <span className="stat-value">$250,000</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">EQUITY</span>
            <span className="stat-value highlight">$262,450</span>
            <span className="stat-change">+$12,450</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">DAILY PROFIT Goal</span>
            <span className="stat-value">2.5%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">WIN RATE</span>
            <span className="stat-value">68%</span>
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
            <span className="perf-value text-green">+$1,240</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4 className="actions-title">Quick Action</h4>
        <div className="action-buttons">
          <button className="action-btn">PAUSE</button>
          <button className="action-btn">STOP ALL</button>
          <button className="action-btn">RESTART</button>
          <button className="action-btn">close all</button>
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
          <h2>Control Panel & Status</h2>
        </div>
        <ControlPanel />
      </div>
    </div>
  );
}
