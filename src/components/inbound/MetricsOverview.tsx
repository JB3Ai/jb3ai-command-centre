import React, { useState, useMemo } from 'react';
import { Lead } from '../../types/inbound';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  CalendarCheck, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight,
  LineChart as LineChartIcon,
  BarChart2
} from 'lucide-react';
import { getSourceIcon } from './utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface MetricsOverviewProps {
  leads: Lead[];
  onSelectChannelFilter?: (channel: string) => void;
  selectedChannel?: string;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ 
  leads, 
  onSelectChannelFilter,
  selectedChannel 
}) => {
  const [chartMode, setChartMode] = useState<'cumulative' | 'daily'>('daily');
  const [showChart, setShowChart] = useState<boolean>(true);

  const total = leads.length;
  const inDiligence = leads.filter(l => l.current_status === 'In Due Diligence').length;
  const researched = leads.filter(l => l.current_status === 'Researched').length;
  const bookingsSent = leads.filter(l => l.current_status === 'Booking Sent').length;
  const callScheduled = leads.filter(l => l.current_status === 'Call Scheduled').length;

  const conversionRate = total > 0 ? Math.round(((bookingsSent + callScheduled) / total) * 100) : 0;

  // Channel distribution counts
  const channels = ['Website', 'WhatsApp', 'Email', 'VoiceGrid', 'YouTube', 'Facebook', 'LinkedIn'] as const;
  const channelCounts = channels.map(c => ({
    name: c,
    count: leads.filter(l => l.origin_source === c).length
  }));

  // Chart data aggregation chronologically
  const chartData = useMemo(() => {
    if (!leads || leads.length === 0) return [];

    const sorted = [...leads].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const dateMap: Record<
      string,
      {
        date: string;
        intake: number;
        converted: number;
        researched: number;
        timestamp: number;
      }
    > = {};

    sorted.forEach(lead => {
      const d = new Date(lead.created_at);
      const dateKey = isNaN(d.getTime())
        ? 'Unknown'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          intake: 0,
          converted: 0,
          researched: 0,
          timestamp: isNaN(d.getTime()) ? 0 : d.getTime()
        };
      }

      dateMap[dateKey].intake += 1;

      if (lead.current_status === 'Call Scheduled' || lead.current_status === 'Booking Sent') {
        dateMap[dateKey].converted += 1;
      }
      if (lead.current_status === 'Researched') {
        dateMap[dateKey].researched += 1;
      }
    });

    const items = Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);

    let runningIntake = 0;
    let runningConverted = 0;
    let runningResearched = 0;

    return items.map(item => {
      runningIntake += item.intake;
      runningConverted += item.converted;
      runningResearched += item.researched;

      return {
        date: item.date,
        'Daily Intake': item.intake,
        'Daily Converted': item.converted,
        'Daily Researched': item.researched,
        'Total Intake': runningIntake,
        'Total Converted': runningConverted,
        'Total Researched': runningResearched
      };
    });
  }, [leads]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#161618] border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-semibold text-gray-200 border-b border-white/5 pb-1 flex items-center justify-between gap-3">
            <span>{label}</span>
            <span className="text-[10px] text-gray-500 font-mono">Pipeline Trend</span>
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-semibold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
            <span className="uppercase tracking-widest text-[10px]">Total Intake</span>
            <div className="p-1 rounded bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 100% Active
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Multi-channel master intake</p>
        </div>

        {/* In Due Diligence */}
        <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
            <span className="uppercase tracking-widest text-[10px]">In Due Diligence</span>
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{inDiligence}</span>
            <span className="text-[11px] font-medium text-amber-400/80">Agent 2 Active</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Background research pending</p>
        </div>

        {/* AI Researched */}
        <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
            <span className="uppercase tracking-widest text-[10px]">AI Researched</span>
            <div className="p-1 rounded bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-300">{researched}</span>
            <span className="text-[11px] font-medium text-purple-400">Gemini Synthesized</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Ready for outreach draft</p>
        </div>

        {/* Bookings & Calls */}
        <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-1">
            <span className="uppercase tracking-widest text-[10px]">Call Scheduled</span>
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{callScheduled + bookingsSent}</span>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Calendly Synced
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{bookingsSent} links sent • {callScheduled} calls</p>
        </div>

        {/* Conversion Efficiency */}
        <div className="col-span-2 md:col-span-1 bg-[#0F0F11] border border-white/5 rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-blue-400 text-xs font-medium mb-1">
            <span className="uppercase tracking-widest text-[10px] text-gray-500">Hand-off Velocity</span>
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{conversionRate}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Pre-CRM
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Qualification to booking rate</p>
        </div>
      </div>

      {/* Lead Conversion Over Time - Area Chart Panel */}
      <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-wide">
                Lead Conversion Over Time
              </h3>
              <p className="text-[11px] text-gray-400">
                Visualizing lead volume vs booking & call conversion velocity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#161618] border border-white/5 rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => setChartMode('daily')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'daily'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Volume per Day
              </button>
              <button
                onClick={() => setChartMode('cumulative')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'cumulative'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Cumulative Growth
              </button>
            </div>

            <button
              onClick={() => setShowChart(!showChart)}
              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
            >
              {showChart ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>

        {showChart && (
          <div className="h-56 w-full pt-1">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResearched" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#ffffff10' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#ffffff10' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={chartMode === 'daily' ? 'Daily Intake' : 'Total Intake'}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIntake)"
                    name="Lead Intake"
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode === 'daily' ? 'Daily Researched' : 'Total Researched'}
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorResearched)"
                    name="AI Researched"
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode === 'daily' ? 'Daily Converted' : 'Total Converted'}
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConverted)"
                    name="Calls & Bookings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 font-mono">
                No lead history data available for chart rendering
              </div>
            )}
          </div>
        )}
      </div>

      {/* Channel Source Quick Filters Bar */}
      <div className="bg-[#0F0F11] border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-gray-500 font-medium px-2 text-[10px] uppercase tracking-widest whitespace-nowrap">
          Filter Origin Channel:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectChannelFilter?.('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium whitespace-nowrap ${
              !selectedChannel || selectedChannel === 'ALL'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            All Channels ({total})
          </button>
          {channelCounts.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => onSelectChannelFilter?.(name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium whitespace-nowrap ${
                selectedChannel === name
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{getSourceIcon(name as any)}</span>
              <span>{name}</span>
              <span className="bg-[#161618] px-1.5 py-0.2 rounded text-[10px] text-gray-300 font-mono">
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

