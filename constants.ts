import { Subject, ModelProvider } from './types';

// 默认 API Keys (来自用户需求 - 实际生产环境应通过环境变量或后端代理处理)
// 注意: 前端直接暴露Key有风险，此代码仅为演示 POC
export const DEFAULT_DEEPSEEK_KEY = "sk-1424c94470794d5b997254ef210e88db";
export const DEFAULT_ZHIPU_KEY = "f118f983ec054bcfb7c7c22a044bcd86.CWQtkrPO8AdvlagJ";

// 学科配置
export const SUBJECT_CHANNELS = [
  { id: Subject.CHINESE, name: '语文', icon: '📖', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: Subject.MATH, name: '数学', icon: '📐', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: Subject.ENGLISH, name: '英语', icon: '🔤', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

// 模型选项
export const MODEL_OPTIONS = [
  { id: ModelProvider.GEMINI, name: 'Gemini 2.5 Flash (推荐OCR)' },
  { id: ModelProvider.DEEPSEEK, name: 'Deepseek V3' },
  { id: ModelProvider.ZHIPU, name: '智谱 GLM-4' },
];