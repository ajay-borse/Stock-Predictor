import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import api from '../utils/api';
import { RefreshCw } from 'lucide-react';

const formatCurrency = (value) => `₹${value.toFixed(2)}`;
const formatVolume = (value) => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toString();
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const HistoricalChart = ({ symbol }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1Y'); // 1M, 3M, 6M, 1Y
  const [activePoint, setActivePoint] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`stocks/history/?symbol=${symbol}`);
      // Assumes response.data.data contains the array of records
      if (response.data && response.data.data) {
        // Ensure data is sorted by date ascending
        const sortedData = [...response.data.data].sort((a, b) => new Date(a.date) - new Date(b.date));
        setData(sortedData);
        if (sortedData.length > 0) {
          setActivePoint(sortedData[sortedData.length - 1]);
        }
      } else {
        setData([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError("Unable to load historical market data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchHistory();
    }
  }, [symbol]);

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const maxDateStr = data[data.length - 1].date;
    const maxDate = new Date(maxDateStr);
    
    let cutoffDate = new Date(maxDate);
    if (timeRange === '1M') cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    else if (timeRange === '3M') cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    else if (timeRange === '6M') cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    else if (timeRange === '1Y') cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    return data.filter(d => new Date(d.date) >= cutoffDate);
  }, [data, timeRange]);

  const handleMouseMove = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setActivePoint(state.activePayload[0].payload);
    }
  };

  const handleMouseLeave = () => {
    if (filteredData.length > 0) {
      setActivePoint(filteredData[filteredData.length - 1]);
    }
  };

  if (loading) {
    return (
      <div className="glass-card historical-chart-container animate-fade-in" style={{ padding: '1.5rem' }}>
        <div className="chart-skeleton">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="skeleton-bg" style={{ width: '12rem', height: '1.5rem', borderRadius: '4px' }}></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-bg" style={{ width: '2.5rem', height: '2rem', borderRadius: '4px' }}></div>)}
            </div>
          </div>
          <div className="skeleton-bg" style={{ height: '16rem', borderRadius: '8px', marginBottom: '1rem' }}></div>
          <div className="skeleton-bg" style={{ height: '6rem', borderRadius: '8px' }}></div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', letterSpacing: '0.1em' }}>
          Loading market history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card historical-chart-container text-center" style={{ padding: '1.5rem' }}>
        <div style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>
        <button onClick={fetchHistory} className="secondary-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto' }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="glass-card historical-chart-container text-center" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>
        No historical data available for this stock.
      </div>
    );
  }

  return (
    <div className="glass-card historical-chart-container animate-fade-in stagger-1" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }} className="stagger-2">
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, background: 'linear-gradient(to right, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Historical Price Performance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, marginTop: '0.25rem' }}>1-year daily closing price history</p>
        </div>
        <div className="time-filters" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {['1M', '3M', '6M', '1Y'].map(range => (
            <button
              key={range}
              className={`time-filter-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Market Data Section */}
      {activePoint && (
        <div className="market-data-bar stagger-3" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
          <div className="market-data-item">
            <div className="label">Date</div>
            <div className="value" style={{ color: '#67e8f9' }}>{formatDate(activePoint.date)}</div>
          </div>
          <div className="market-data-item">
            <div className="label">Open</div>
            <div className="value">{formatCurrency(activePoint.open)}</div>
          </div>
          <div className="market-data-item">
            <div className="label">High</div>
            <div className="value" style={{ color: '#34d399' }}>{formatCurrency(activePoint.high)}</div>
          </div>
          <div className="market-data-item">
            <div className="label">Low</div>
            <div className="value" style={{ color: '#fb7185' }}>{formatCurrency(activePoint.low)}</div>
          </div>
          <div className="market-data-item">
            <div className="label">Volume</div>
            <div className="value" style={{ color: '#d8b4fe' }}>{formatVolume(activePoint.volume)}</div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div className="chart-wrapper stagger-4" style={{ height: '350px', marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={(dateStr) => {
                const date = new Date(dateStr);
                return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;
              }}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              minTickGap={30}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickFormatter={(val) => `₹${val}`}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                borderColor: 'rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#06b6d4', fontWeight: 600 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              labelFormatter={(label) => formatDate(label)}
              formatter={(value) => [formatCurrency(value), 'Close']}
              cursor={{ stroke: 'rgba(6, 182, 212, 0.4)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="stagger-5">
        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500, margin: 0 }}>Trading Volume</h4>
        <div className="volume-wrapper" style={{ height: '120px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis 
                hide 
                domain={[0, 'auto']} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px'
                }}
                labelFormatter={(label) => formatDate(label)}
                formatter={(value) => [formatVolume(value), 'Volume']}
              />
              <Bar 
                dataKey="volume" 
                fill="#8b5cf6" 
                opacity={0.7}
                radius={[2, 2, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalChart;
