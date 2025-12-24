import { Subject, KnowledgeItem, KnowledgeSearchResult, KnowledgeBaseConfig } from '../types';

// 本地存储键名
const STORAGE_KEY = 'smartgrade_knowledge_base';

/**
 * 初始化知识库服务
 * 检查本地存储是否存在知识库数据，如果不存在则创建默认数据
 */
export const initKnowledgeBase = () => {
  const existingData = localStorage.getItem(STORAGE_KEY);
  if (!existingData) {
    // 创建默认知识库数据
    const defaultData: KnowledgeItem[] = [
      // 语文知识库示例
      {
        id: 'chinese-001',
        title: '常见修辞手法解析',
        content: '修辞手法是语文学习中的重要内容，常见的修辞手法包括比喻、拟人、夸张、排比、对偶等。\n\n**比喻**：用跟甲事物有相似之点的乙事物来描写或说明甲事物。\n示例：叶子出水很高，像亭亭的舞女的裙。\n\n**拟人**：把事物人格化，将本来不具备人动作和感情的事物变成和人一样具有动作和感情的样子。\n示例：鸟儿在枝头歌唱。',
        subject: Subject.CHINESE,
        keywords: ['修辞手法', '比喻', '拟人', '夸张', '排比', '对偶'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'chinese-002',
        title: '古诗文鉴赏方法',
        content: '古诗文鉴赏需要从以下几个方面入手：\n1. **意象分析**：理解诗中意象的象征意义\n2. **意境营造**：体会诗歌营造的氛围和情感\n3. **表现手法**：识别运用的修辞手法和表达方式\n4. **思想感情**：把握作者表达的思想情感\n5. **语言特色**：分析诗歌的语言风格和特色',
        subject: Subject.CHINESE,
        keywords: ['古诗文鉴赏', '意象', '意境', '表现手法', '思想感情'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 数学知识库示例
      {
        id: 'math-001',
        title: '一元二次方程解法',
        content: '一元二次方程的一般形式为：$ax^2 + bx + c = 0$（$a ≠ 0$）\n\n**解法一：直接开平方法**\n适用于形如$(x + m)^2 = n$（$n ≥ 0$）的方程\n\n**解法二：配方法**\n步骤：\n1. 移项：$ax^2 + bx = -c$\n2. 二次项系数化为1：$x^2 + \\frac{b}{a}x = -\\frac{c}{a}$\n3. 配方：$x^2 + \\frac{b}{a}x + (\\frac{b}{2a})^2 = -\\frac{c}{a} + (\\frac{b}{2a})^2$\n4. 写成完全平方：$(x + \\frac{b}{2a})^2 = \\frac{b^2 - 4ac}{4a^2}$\n5. 开平方求解\n\n**解法三：公式法**\n求根公式：$x = \\frac{-b ± \\sqrt{b^2 - 4ac}}{2a}$\n判别式：$Δ = b^2 - 4ac$\n- $Δ > 0$：两个不相等的实数根\n- $Δ = 0$：两个相等的实数根\n- $Δ < 0$：无实数根',
        subject: Subject.MATH,
        keywords: ['一元二次方程', '直接开平方法', '配方法', '公式法', '判别式'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'math-002',
        title: '三角形面积公式',
        content: '三角形面积的计算公式：\n\n1. **基本公式**：$S = \\frac{1}{2} × 底 × 高$\n\n2. **海伦公式**：$S = \\sqrt{p(p-a)(p-b)(p-c)}$\n其中$p = \\frac{a + b + c}{2}$，$a, b, c$为三角形的三边长\n\n3. **向量法**：若已知三角形三个顶点的坐标$(x_1,y_1)$、$(x_2,y_2)$、$(x_3,y_3)$，则面积为：\n$S = \\frac{1}{2} |(x_2 - x_1)(y_3 - y_1) - (x_3 - x_1)(y_2 - y_1)|$',
        subject: Subject.MATH,
        keywords: ['三角形面积', '基本公式', '海伦公式', '向量法'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      // 英语知识库示例
      {
        id: 'english-001',
        title: '一般现在时用法',
        content: '一般现在时主要用于以下几种情况：\n\n1. **表示经常发生的动作或存在的状态**\n   - He goes to school every day.\n   - The sun rises in the east.\n\n2. **表示客观真理或科学事实**\n   - The earth moves around the sun.\n   - Water boils at 100℃.\n\n3. **表示按计划、安排将要发生的动作**（常用于火车、飞机等时刻表）\n   - The train leaves at 8:30 tomorrow morning.\n\n4. **在时间、条件状语从句中表示将来**\n   - I will call you when I arrive.\n   - If it rains tomorrow, we will stay at home.',
        subject: Subject.ENGLISH,
        keywords: ['一般现在时', '英语时态', '语法', '客观真理', '条件状语从句'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'english-002',
        title: '英语写作常用句型',
        content: '英语写作中常用的句型结构：\n\n1. **引出话题**\n   - Recently, the issue of... has been brought into public focus.\n   - With the development of..., more and more people...\n\n2. **表达观点**\n   - In my opinion, it is necessary to...\n   - From my perspective, I believe that...\n\n3. **列举原因**\n   - There are several reasons for this.\n   - The main reason is that...\n\n4. **总结全文**\n   - In conclusion, we can draw the following conclusion...\n   - All in all, it is important to...',
        subject: Subject.ENGLISH,
        keywords: ['英语写作', '句型', '写作技巧', '表达观点', '总结'],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    console.log('默认知识库数据已初始化');
  }
};

/**
 * 获取知识库中的所有条目
 */
export const getAllKnowledgeItems = (): KnowledgeItem[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * 根据学科获取知识库条目
 * @param subject 学科
 */
export const getKnowledgeItemsBySubject = (subject: Subject): KnowledgeItem[] => {
  const allItems = getAllKnowledgeItems();
  return allItems.filter(item => item.subject === subject);
};

/**
 * 搜索知识库
 * @param query 搜索关键词
 * @param subject 可选的学科过滤
 */
export const searchKnowledgeBase = (query: string, subject?: Subject): KnowledgeSearchResult => {
  const allItems = subject ? getKnowledgeItemsBySubject(subject) : getAllKnowledgeItems();
  
  if (!query.trim()) {
    return {
      items: allItems,
      total: allItems.length
    };
  }
  
  const lowerQuery = query.toLowerCase();
  const filteredItems = allItems.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.content.toLowerCase().includes(lowerQuery) ||
    item.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
  
  return {
    items: filteredItems,
    total: filteredItems.length
  };
};

/**
 * 获取知识库配置信息
 * @param subject 学科
 */
export const getKnowledgeBaseConfig = (subject: Subject): KnowledgeBaseConfig => {
  const items = getKnowledgeItemsBySubject(subject);
  
  const subjectNames: { [key in Subject]: string } = {
    [Subject.CHINESE]: '语文',
    [Subject.MATH]: '数学',
    [Subject.ENGLISH]: '英语'
  };
  
  return {
    id: `kb-${subject.toLowerCase()}`,
    name: `${subjectNames[subject]}知识库`,
    description: `${subjectNames[subject]}学科相关的知识点、解题方法和学习资源`,
    subject: subject,
    itemCount: items.length
  };
};

/**
 * 添加知识库条目
 * @param item 知识库条目
 */
export const addKnowledgeItem = (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeItem => {
  const allItems = getAllKnowledgeItems();
  const newItem: KnowledgeItem = {
    ...item,
    id: `${item.subject.toLowerCase()}-${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  allItems.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allItems));
  
  return newItem;
};

/**
 * 更新知识库条目
 * @param id 条目ID
 * @param updates 更新内容
 */
export const updateKnowledgeItem = (id: string, updates: Partial<KnowledgeItem>): KnowledgeItem | null => {
  const allItems = getAllKnowledgeItems();
  const index = allItems.findIndex(item => item.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedItem: KnowledgeItem = {
    ...allItems[index],
    ...updates,
    updatedAt: Date.now()
  };
  
  allItems[index] = updatedItem;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allItems));
  
  return updatedItem;
};

/**
 * 删除知识库条目
 * @param id 条目ID
 */
export const deleteKnowledgeItem = (id: string): boolean => {
  const allItems = getAllKnowledgeItems();
  const newItems = allItems.filter(item => item.id !== id);
  
  if (newItems.length === allItems.length) {
    return false; // 未找到要删除的条目
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  return true;
};

/**
 * 获取与作业内容相关的知识库条目
 * @param content 作业内容
 * @param subject 学科
 */
export const getRelevantKnowledgeItems = (content: string, subject: Subject): KnowledgeItem[] => {
  const subjectItems = getKnowledgeItemsBySubject(subject);
  const lowerContent = content.toLowerCase();
  
  // 计算相关性得分
  const scoredItems = subjectItems.map(item => {
    let score = 0;
    
    // 标题匹配得分
    if (item.title.toLowerCase().includes(lowerContent)) {
      score += 3;
    }
    
    // 内容匹配得分
    if (item.content.toLowerCase().includes(lowerContent)) {
      score += 2;
    }
    
    // 关键词匹配得分
    const matchedKeywords = item.keywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    score += matchedKeywords.length;
    
    return { item, score };
  });
  
  // 按得分降序排序，取前3个
  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);
};