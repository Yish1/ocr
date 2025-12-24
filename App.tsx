import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { Subject, ModelProvider, StatsData, AnalysisResult, KnowledgeItem } from './types';
import { MODEL_OPTIONS, SUBJECT_CHANNELS } from './constants';
import ChannelSelector from './components/ChannelSelector';
import FileUpload from './components/FileUpload';
import StatsDashboard from './components/StatsDashboard';
import { callDeepseekAPI, performOCRWithZhipu } from './services/externalApiService';
import { initKnowledgeBase, getRelevantKnowledgeItems } from './services/knowledgeBaseService';

// --- 类型定义 ---
interface ProcessedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: AnalysisResult;
  errorMsg?: string;
  subject: Subject; // 绑定文件所属的学科通道
}

// 视图状态: 首页大厅 | 具体工作区
type ViewState = 'home' | 'workspace';

const App: React.FC = () => {
  // --- 状态管理 State ---
  
  // view: 控制当前显示的是“通道选择大厅”还是“作业批改工作区”
  const [view, setView] = useState<ViewState>('home');
  
  // selectedSubject: 当前选中的学科（语文/数学/英语），决定了 Prompt 的角色设定
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.CHINESE);
  
  // fileList: 存储所有上传的文件及其处理状态
  const [fileList, setFileList] = useState<ProcessedFile[]>([]);
  
  // isGlobalLoading: 全局加载锁，防止重复提交
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  
  // loadingStep: 用于向用户展示当前 AI 正在进行的具体步骤 (OCR 或 批改)
  const [loadingStep, setLoadingStep] = useState<string>(''); 
  
  // stats: 统计数据，用于图表展示
  const [stats, setStats] = useState<StatsData>({
    filesProcessed: 12,
    totalTokensUsed: 4500,
    subjectDistribution: {
      [Subject.CHINESE]: 5,
      [Subject.MATH]: 3,
      [Subject.ENGLISH]: 4
    }
  });

  // --- 过滤视图数据 ---
  // 功能：根据当前选中的学科，过滤出属于该学科的文件列表
  // 目的：实现“数学搜数学题，语文搜语文题”的通道隔离效果
  const currentChannelFiles = fileList.filter(f => f.subject === selectedSubject);

  // 获取当前学科的配置信息 (颜色、图标等)
  const currentSubjectConfig = SUBJECT_CHANNELS.find(c => c.id === selectedSubject) || SUBJECT_CHANNELS[0];

  // 初始化知识库
  useEffect(() => {
    initKnowledgeBase();
  }, []);

  // --- 交互处理函数 ---

  // 功能：进入特定学科通道
  const enterChannel = (subject: Subject) => {
    setSelectedSubject(subject);
    setView('workspace'); // 切换到工作区视图
  };

  // 功能：返回大厅
  const goHome = () => {
    if (isGlobalLoading) return; // 处理中禁止返回，防止状态错乱
    setView('home');
  };

  // 功能：处理多文件选择
  const handleFilesSelected = (files: File[]) => {
    // 将新上传的文件绑定到“当前选中的学科”
    const newFiles: ProcessedFile[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9), // 生成唯一ID
      file: f,
      previewUrl: URL.createObjectURL(f), // 生成本地预览地址
      status: 'pending',
      subject: selectedSubject // 关键：标记文件属于哪个学科
    }));
    setFileList(prev => [...prev, ...newFiles]);
  };

  // 功能：移除文件
  const removeFile = (id: string) => {
    setFileList(prev => prev.filter(f => f.id !== id));
  };

  // ==================================================================================
  // 核心逻辑: 开始分析 (批量处理 - 仅处理当前通道)
  // 流程：
  // 1. 遍历文件 -> 2. 转Base64 -> 3. 智谱OCR识别 -> 4. Deepseek批改 -> 5. 更新UI
  // ==================================================================================
  const handleAnalyzeAll = async () => {
    // 只获取当前学科下“待处理”或“失败”的文件
    const pendingFiles = currentChannelFiles.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsGlobalLoading(true);

    for (const item of pendingFiles) {
        
        // 更新文件状态为 "处理中"
        updateFileStatus(item.id, 'processing');

        try {
            // --- 步骤 1: 图片预处理 ---
            // 说明：API 需要 Base64 格式的图片数据
            const base64Data = await fileToBase64(item.file);

            // --- 步骤 2: OCR 识别 ---
            // 技术：调用智谱 GLM-4V Plus (高精度)
            setLoadingStep(`正在识别图片文字 (智谱AI GLM-4V Plus)...`);
            const ocrText = await performOCRWithZhipu(base64Data);

            // --- 步骤 3: 智能批改 ---
            // 技术：调用 Deepseek V3
            setLoadingStep(`正在进行智能批改 (Deepseek V3)...`);
            
            // 使用文件绑定的 subject
            const currentPromptSubject = item.subject;

            // 获取与当前作业相关的知识库条目
            const relevantKnowledge = getRelevantKnowledgeItems(ocrText, currentPromptSubject);
            
            // 构建知识库参考内容
            const knowledgeReference = relevantKnowledge.length > 0 ? 
                `
                ## 参考知识库内容
                ${relevantKnowledge.map(item => `### ${item.title}
${item.content}`).join('\n')}` : 
                '';

            // 优化 Prompt (提示词): 
            // 1. 强调使用 Markdown 格式，配合前端渲染器。
            // 2. 要求“言简意赅”，为了解决用户提到的“分析慢”问题。
            const systemPrompt = `
                你是一位资深的${currentPromptSubject}阅卷老师。
                请根据以下OCR识别出的学生作业内容进行批改。
                ${knowledgeReference}
                
                【重要要求】
                1. **速度优先**：分析要言简意赅，直击要点，不要有废话。
                2. **格式规范**：必须使用标准的 Markdown 语法。数学公式请使用 LaTeX 格式（例如 $E=mc^2$）。
                3. **强调重点**：错误的地方请加粗 (**粗体**)，并说明原因。
                
                请严格按照以下结构输出：
                
                # 评分: [0-100]
                
                ## ❌ 错误诊断
                *(如果无错误，直接写“无明显错误”。如果有错，请列出并加粗关键错误点)*
                
                ## ✅ 正确解析
                *(简明扼要的解题思路，支持公式)*
                
                ## 💡 评语
             `;

            // 发起 Deepseek 请求
            const correctionResult = await callDeepseekAPI(ocrText, systemPrompt);

            // --- 步骤 4: 完成 ---
            updateFileStatus(item.id, 'completed', {
                ocrText,
                correction: correctionResult
            });

            // 更新统计数据
            setStats(prev => ({
                filesProcessed: prev.filesProcessed + 1,
                totalTokensUsed: prev.totalTokensUsed + (ocrText.length + correctionResult.length),
                subjectDistribution: {
                  ...prev.subjectDistribution,
                  [item.subject]: prev.subjectDistribution[item.subject] + 1
                }
            }));

        } catch (error) {
            console.error("Processing failed for file", item.id, error);
            updateFileStatus(item.id, 'error', undefined, error instanceof Error ? error.message : "处理失败");
        }
    }

    setIsGlobalLoading(false);
    setLoadingStep('');
  };

  // 辅助: 更新单文件状态
  const updateFileStatus = (id: string, status: ProcessedFile['status'], result?: AnalysisResult, errorMsg?: string) => {
      setFileList(prev => prev.map(f => {
          if (f.id === id) {
              return { ...f, status, result, errorMsg };
          }
          return f;
      }));
  };

  // 辅助: 文件转Base64 Promise封装
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); 
        };
        reader.readAsDataURL(file);
      });
  };

  // 辅助：从 Markdown 中提取分数 (用于显示大号分数卡片)
  const extractScore = (text: string): string | null => {
      const match = text.match(/#\s*评分[:：]\s*(\d+)/);
      return match ? match[1] : null;
  };

  // --- 渲染界面 UI ---
  
  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* 侧边栏 (始终显示) */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full hidden md:flex flex-col p-6 z-20">
        <div className="flex items-center mb-10 cursor-pointer" onClick={() => !isGlobalLoading && goHome()}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold mr-3">
            AI
          </div>
          <h1 className="text-xl font-bold text-slate-800">智评系统</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
             onClick={() => !isGlobalLoading && goHome()}
             className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${view === 'home' ? 'bg-blue-50 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <span className="text-xl mr-3">🏠</span>
             通道大厅
          </button>
          
          {view === 'workspace' && (
             <div className={`w-full flex items-center px-4 py-3 rounded-xl font-medium bg-slate-100 text-slate-800`}>
                <span className="text-xl mr-3">{currentSubjectConfig.icon}</span>
                {currentSubjectConfig.name}批改
             </div>
          )}
        </nav>

        <div className="mt-auto">
           <StatsDashboard stats={stats} />
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 md:ml-64 p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-center mb-8">
          <div>
            {view === 'home' ? (
                <>
                    <h2 className="text-2xl font-bold text-slate-900">欢迎使用智评 AI</h2>
                    <p className="text-slate-500 mt-1">请选择下方学科通道进行作业搜索与批改</p>
                </>
            ) : (
                <div className="flex items-center">
                    <button 
                        onClick={goHome}
                        disabled={isGlobalLoading}
                        className="mr-4 p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30"
                        title="返回大厅"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                            <span className="mr-2 text-3xl">{currentSubjectConfig.icon}</span>
                            {currentSubjectConfig.name}作业批改通道
                        </h2>
                        {/* 明确展示使用的技术栈 */}
                        <p className="text-slate-500 mt-1 text-sm flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-semibold">Deepseek 批改</span>
                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-semibold">智谱 GLM-4V Plus</span>
                        </p>
                    </div>
                </div>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-sm font-medium text-slate-700">系统在线</span>
          </div>
        </header>


        {/* 核心内容区: 根据视图切换 */}
        {view === 'home' ? (
            <div className="flex-1 flex flex-col justify-center pb-20 animate-fade-in-up">
                <ChannelSelector onSelect={enterChannel} />
                
                <div className="text-center mt-12 text-slate-400 text-sm">
                    支持多学科独立通道 · 自动知识库挂载 · 智能OCR识别
                </div>
            </div>
        ) : (
            <div className="animate-fade-in">
                 {/* 知识库状态 */}
                 <div className={`mb-6 p-4 rounded-xl flex items-center justify-between border ${currentSubjectConfig.color.replace('text-', 'border-').split(' ')[2]} bg-opacity-30 bg-white`}>
                     <div className="flex items-center">
                     <div className={`w-2 h-2 rounded-full mr-3 ${currentSubjectConfig.color.includes('red') ? 'bg-red-500' : currentSubjectConfig.color.includes('blue') ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                     <p className="text-sm text-slate-700">
                         <span className="font-bold">已连接{selectedSubject}本地知识库</span>
                     </p>
                     </div>
                 </div>

                {/* 上传区域 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                        <span className={`px-2 py-0.5 rounded text-xs mr-2 border ${currentSubjectConfig.color} bg-opacity-10`}>
                            {selectedSubject}搜题
                        </span>
                        上传作业图片 (支持批量/粘贴)
                    </h3>
                    <FileUpload onFilesSelected={handleFilesSelected} disabled={isGlobalLoading} />
                </div>

                {/* 待处理/处理结果列表 - 仅显示当前通道内容 */}
                <div className="space-y-8">
                    {currentChannelFiles.length > 0 ? (
                        <>
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 text-lg">{selectedSubject}作业列表 ({currentChannelFiles.length})</h3>
                            <button 
                                onClick={handleAnalyzeAll}
                                disabled={isGlobalLoading || currentChannelFiles.every(f => f.status === 'completed')}
                                className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isGlobalLoading && (
                                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                   </svg>
                                )}
                                {isGlobalLoading ? loadingStep : `开始${selectedSubject}批改`}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {currentChannelFiles.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-fade-in">
                                    {/* 左侧: 图片 */}
                                    <div className="w-full md:w-1/3 bg-slate-100 p-4 border-b md:border-b-0 md:border-r border-slate-200 relative group">
                                        <img src={item.previewUrl} alt="Homework" className="w-full h-64 object-contain rounded-lg" />
                                        <button 
                                            onClick={() => removeFile(item.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="移除"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                        
                                        {/* 学科标签 */}
                                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded shadow-sm text-slate-600">
                                            {item.subject}
                                        </div>

                                        {/* 状态遮罩 */}
                                        {item.status === 'processing' && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white backdrop-blur-sm z-10">
                                                <div className="text-center p-4">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white mx-auto mb-2"></div>
                                                    <span className="text-sm font-medium">{loadingStep}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 右侧: 结果 */}
                                    <div className="w-full md:w-2/3 p-6 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-slate-800">分析结果</h4>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                    item.status === 'error' ? 'bg-red-100 text-red-700' : 
                                                    item.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}
                                            `}>
                                                {item.status === 'completed' ? '已完成' : item.status === 'error' ? '失败' : item.status === 'processing' ? '分析中' : '待处理'}
                                            </span>
                                        </div>

                                        {item.errorMsg && (
                                            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
                                                {item.errorMsg}
                                            </div>
                                        )}

                                        {item.result ? (
                                            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2">
                                                {/* OCR 结果折叠区 */}
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 group">
                                                    <p className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                                                        <span>OCR 识别内容 (智谱 GLM-4V Plus)</span>
                                                        <span className="text-xs font-normal text-slate-400 group-hover:text-primary cursor-pointer">查看全部</span>
                                                    </p>
                                                    <p className="text-xs text-slate-600 font-mono line-clamp-2 group-hover:line-clamp-none transition-all cursor-pointer">
                                                        {item.result.ocrText}
                                                    </p>
                                                </div>
                                                
                                                {/* 
                                                    Markdown 渲染区域 
                                                    功能: 解析 Markdown 语法、渲染数学公式、加粗错误
                                                */}
                                                <div className="prose prose-sm max-w-none text-slate-700">
                                                    <p className="text-xs font-bold text-slate-500 mb-2">批改意见 (Deepseek V3):</p>
                                                    
                                                    {/* 单独提取分数显示为大卡片 */}
                                                    {extractScore(item.result.correction) && (
                                                         <div className="my-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm">
                                                            <div className="flex items-center">
                                                                <span className="text-2xl mr-2">🏆</span>
                                                                <span className="font-bold text-blue-900 text-lg">本次作业得分</span>
                                                            </div>
                                                            <span className="text-4xl font-black text-blue-600">{extractScore(item.result.correction)}</span>
                                                        </div>
                                                    )}

                                                    {/* 使用 ReactMarkdown 渲染核心内容 */}
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkMath]} 
                                                        rehypePlugins={[rehypeKatex]}
                                                        components={{
                                                            // 自定义标题样式
                                                            h2: ({node, ...props}) => {
                                                                const isError = props.children?.toString().includes('错误');
                                                                return <h2 className={`text-lg font-bold mt-4 mb-2 pb-1 border-b ${isError ? 'text-red-600 border-red-200' : 'text-slate-800 border-slate-200'}`} {...props} />
                                                            },
                                                            // 自定义粗体样式 (错误高亮)
                                                            strong: ({node, ...props}) => <strong className="font-bold text-red-600 bg-red-50 px-1 rounded" {...props} />
                                                        }}
                                                    >
                                                        {item.result.correction}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                                                {item.status === 'processing' ? 'AI正在思考中...' : '等待分析...'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                            <div className="text-slate-300 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-medium">当前 {selectedSubject} 通道暂无作业</p>
                            <p className="text-slate-400 text-sm mt-1">请上方上传图片开始批改</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;