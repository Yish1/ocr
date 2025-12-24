// 定义学科枚举
export enum Subject {
  CHINESE = '语文',
  MATH = '数学',
  ENGLISH = '英语'
}

// 定义AI模型提供商枚举
export enum ModelProvider {
  GEMINI = 'Gemini (Google)',
  DEEPSEEK = 'Deepseek',
  ZHIPU = '智谱GLM'
}

// 聊天/分析消息结构
export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

// OCR及分析结果结构
export interface AnalysisResult {
  ocrText: string; // 原始OCR文本
  correction: string; // 批改结果
  score?: number; // 评分 (可选)
  feedback?: string; // 简评 (可选)
}

// 统计数据结构
export interface StatsData {
  filesProcessed: number;
  totalTokensUsed: number;
  subjectDistribution: {
    [key in Subject]: number;
  };
}

// 知识库条目类型
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  subject: Subject;
  keywords: string[];
  createdAt: number;
  updatedAt: number;
}

// 知识库搜索结果类型
export interface KnowledgeSearchResult {
  items: KnowledgeItem[];
  total: number;
}

// 知识库配置类型
export interface KnowledgeBaseConfig {
  id: string;
  name: string;
  description: string;
  subject: Subject;
  itemCount: number;
}