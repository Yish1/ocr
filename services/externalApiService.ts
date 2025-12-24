import { DEFAULT_DEEPSEEK_KEY, DEFAULT_ZHIPU_KEY } from "../constants";

/**
 * ==============================================================================
 * 功能模块：OCR 文字识别
 * 技术支持：智谱 AI (Zhipu GLM-4V Plus)
 * 作用：将用户上传的作业图片转换为可编辑的文本，供 Deepseek 分析。
 * ==============================================================================
 * @param imageBase64 图片的 Base64 编码字符串
 */
export const performOCRWithZhipu = async (imageBase64: string): Promise<string> => {
    // 智谱 OpenAI 兼容接口地址
    const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

    try {
        console.log("正在调用智谱GLM-4V Plus进行OCR识别...");
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 使用 Bearer Token 方式认证
                "Authorization": `Bearer ${DEFAULT_ZHIPU_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4v-plus", // 升级为 Plus 版本，识别准确率更高
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "请精准识别这张图片中的所有文字，保持原有段落结构。数学公式请尽量转换为LaTeX格式。只输出识别到的文字，不要包含“这张图片写了...”等任何解释性语句。" },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1 // 低温度，让OCR结果更确定、更准确
            })
        });

        if (!response.ok) {
             const errText = await response.text();
             throw new Error(`Zhipu OCR Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        // 返回模型识别出的文本内容
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Zhipu OCR failed:", error);
        throw error;
    }
};

/**
 * ==============================================================================
 * 功能模块：智能批改与分析
 * 技术支持：Deepseek (深度求索) V3
 * 作用：接收 OCR 识别出的文本，根据系统提示词(System Prompt)进行评分、纠错和点评。
 * ==============================================================================
 * @param content OCR 识别出来的作业文本
 * @param systemPrompt 预设的老师角色和评分标准
 */
export const callDeepseekAPI = async (content: string, systemPrompt: string): Promise<string> => {
  // Deepseek 官方 API 地址
  const API_URL = "https://api.deepseek.com/chat/completions";
  
  try {
    console.log("正在调用Deepseek V3进行作业批改...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEFAULT_DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 使用 Deepseek V3 模型
        messages: [
          // system 角色：设定 AI 的身份（例如：严厉的数学老师）
          { role: "system", content: systemPrompt },
          // user 角色：提供学生的作业内容
          { role: "user", content: content }
        ],
        stream: false, // 暂不使用流式输出，等待完整结果
        temperature: 0.3 // 较低温度，保证批改的严谨性，减少幻觉
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Deepseek API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Deepseek call failed:", error);
    throw error;
  }
};

/**
 * (保留) 调用智谱文本接口 - 备用
 */
export const callZhipuAPI = async (content: string, systemPrompt: string): Promise<string> => {
    const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEFAULT_ZHIPU_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: content }
                ]
            })
        });

        if (!response.ok) {
             throw new Error(`Zhipu API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Zhipu call failed:", error);
        throw error;
    }
}