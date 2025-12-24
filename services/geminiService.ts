import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// 初始化 Gemini 客户端
// 必须使用 process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 使用 Gemini 模型进行 OCR 识别和初步分析
 * @param imageBase64 图片的 Base64 编码
 * @param prompt 提示词
 * @returns 解析后的文本结果
 */
export const analyzeImageWithGemini = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // 使用 Flash 模型，速度快且具备视觉能力
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // 假设转换为 JPEG
              data: imageBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || "无法识别内容";
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Gemini OCR 处理失败");
  }
};