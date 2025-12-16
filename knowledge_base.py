import os
import requests
from typing import Optional, Dict

class AnythingLLMClient:
    def __init__(self):
        # 从连接字符串解析配置（也可通过环境变量注入）
        self.connection_string = os.environ.get(
            "ANYTHINGLLM_CONN_STR",
            "http://localhost:3001/api|brx-8DTPQQC-BNKMDK2-HWFMA1A-W3XJ9WY"
        )
        # 拆分基础URL和API密钥
        self.base_url, self.api_key = self._parse_conn_string()
        # 目标工作区ID（保持不变，根据实际修改）
        self.workspace_id = os.environ.get("ANYTHINGLLM_WORKSPACE_ID", "default")
        # 请求头（适配AnythingLLM认证）
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def _parse_conn_string(self) -> tuple[str, str]:
        """解析 EXTENSION CONNECTION STRING，返回(base_url, api_key)"""
        parts = self.connection_string.split("|")
        if len(parts) != 2:
            raise ValueError("连接字符串格式错误，应为：API地址|密钥")
        base_url = parts[0].strip().rstrip("/")  # 移除末尾斜杠，避免拼接重复
        api_key = parts[1].strip()
        return base_url, api_key

    def query_knowledge_base(self, ocr_text: str) -> Optional[str]:
        """调用AnythingLLM知识库查询接口（适配/api基础路径）"""
        # 完整接口地址：base_url + /v1/chat
        api_endpoint = f"{self.base_url}/v1/chat"
        
        # 请求参数（严格适配AnythingLLM API规范）
        payload: Dict = {
            "workspaceId": self.workspace_id,
            "messages": [
                {
                    "role": "user",
                    "content": f"基于知识库内容回答以下问题：{ocr_text}\n要求：仅基于知识库已有信息回答，无相关信息时回复'无相关知识库内容'"
                }
            ],
            "stream": False,  # 关闭流式响应
            "model": "auto",
            "temperature": 0.1
        }

        try:
            response = requests.post(
                url=api_endpoint,
                json=payload,
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            answer = result.get("data", {}).get("content", "").strip()
            return answer if answer else "无相关知识库内容"

        except requests.exceptions.HTTPError as e:
            print(f"API请求错误：{e} | 响应内容：{response.text if 'response' in locals() else '无'}")
            return "知识库查询失败（HTTP错误）"
        except Exception as e:
            print(f"知识库查询异常：{e}")
            return "知识库查询失败（系统异常）"