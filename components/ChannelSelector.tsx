import React from 'react';
import { Subject } from '../types';
import { SUBJECT_CHANNELS } from '../constants';

interface ChannelSelectorProps {
  onSelect: (subject: Subject) => void;
  disabled?: boolean;
}

// 渲染学科选择通道 (首页入口)
// 任务: "渠道变成那种按钮的形式，然后跳到...通道"
// 设计: 大卡片式入口，点击后跳转进入特定工作区
const ChannelSelector: React.FC<ChannelSelectorProps> = ({ onSelect, disabled }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto mt-8">
      {SUBJECT_CHANNELS.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onSelect(channel.id)}
          disabled={disabled}
          className={`
            relative group flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all duration-300
            bg-white hover:-translate-y-2 hover:shadow-xl
            ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
            ${channel.color.replace('bg-', 'border-').replace('text-', 'hover:border-')}
          `}
        >
          {/* 背景装饰 */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl ${channel.color.split(' ')[0].replace('100', '500')}`}></div>
          
          {/* 图标 */}
          <div className={`
            w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300
            ${channel.color}
          `}>
            {channel.icon}
          </div>
          
          {/* 标题 */}
          <h3 className="text-2xl font-bold text-slate-800 mb-2">{channel.name}通道</h3>
          <p className="text-slate-500 text-sm mb-6">点击进入{channel.name}作业批改</p>
          
          {/* 按钮样式指示器 */}
          <div className={`
            px-6 py-2 rounded-full text-sm font-bold transition-colors
            bg-slate-100 text-slate-600 group-hover:text-white
            ${channel.id === Subject.CHINESE ? 'group-hover:bg-red-500' : ''}
            ${channel.id === Subject.MATH ? 'group-hover:bg-blue-500' : ''}
            ${channel.id === Subject.ENGLISH ? 'group-hover:bg-purple-500' : ''}
          `}>
            进入搜索
          </div>
        </button>
      ))}
    </div>
  );
};

export default ChannelSelector;