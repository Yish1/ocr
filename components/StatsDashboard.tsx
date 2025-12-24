import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatsData, Subject } from '../types';

interface StatsDashboardProps {
  stats: StatsData;
}

// 统计面板组件
// 任务: 统计系统和用户输出 (加分)
const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  const data = Object.entries(stats.subjectDistribution).map(([subject, count]) => ({
    name: subject,
    value: count,
  }));

  const COLORS = ['#ef4444', '#3b82f6', '#a855f7']; // 对应 语文, 数学, 英语

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        作业批改数据统计
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-sm text-slate-500">累计处理文件</p>
          <p className="text-2xl font-bold text-slate-800">{stats.filesProcessed}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-sm text-slate-500">Token消耗预估</p>
          <p className="text-2xl font-bold text-slate-800">{stats.totalTokensUsed.toLocaleString()}</p>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{fill: 'transparent'}}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsDashboard;