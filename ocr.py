import os
import base64
from openai import OpenAI
from PIL import Image
import io
from typing import Optional

# Prefer environment variable for API key, fall back to the embedded key if not set
client = OpenAI(
    api_key="sk-avvchuomkxumfywtzuuupwcojdngvxqggwnpigghmzwolfqo",
    base_url="https://api.siliconflow.cn/v1"
)


def convert_image_to_webp_base64(input_image_path: str) -> Optional[str]:
    try:
        with Image.open(input_image_path) as img:
            # 转换为WebP格式（优化大小）
            byte_arr = io.BytesIO()
            img.save(byte_arr, format='WEBP', quality=85)  # 调整质量平衡大小和清晰度
            byte_arr = byte_arr.getvalue()
            return base64.b64encode(byte_arr).decode('utf-8')
    except Exception as e:
        print(f"图片转换错误: {e}")
        return None


def convert_image_bytes_to_webp_base64(image_bytes: bytes) -> Optional[str]:
    """接受图片字节，返回 WebP 格式的 base64 编码字符串。"""
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            byte_arr = io.BytesIO()
            img.save(byte_arr, format='WEBP', quality=85)
            return base64.b64encode(byte_arr.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"图片字节转换错误: {e}")
        return None

def execute_ocr_process(base64_image: str, user_prompt: str) -> str:
    """调用模型进行 OCR，并返回完整的识别文本（不打印）。"""
    # 创建流式请求
    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-VL-72B-Instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/webp;base64,{base64_image}",  # 指定WebP格式
                            "detail": "high"  # 平衡速度与精度
                        }
                    },
                    {
                        "type": "text",
                        "text": f"{user_prompt}"  # 替换为你的提示词
                    }
                ]
            }
        ],
        stream=True,
        max_tokens=1000  # 控制响应长度
    )

    full_response = ""
    for chunk in response:
        try:
            # 兼容不同返回类型（有些实现返回 dict，有些返回对象）
            delta = chunk.choices[0].delta
            content = None
            if isinstance(delta, dict):
                content = delta.get('content')
            else:
                content = getattr(delta, 'content', None)

            if content:
                full_response += content
        except Exception:
            # 忽略单个块的解析错误，继续收集
            continue

    return full_response


if __name__ == '__main__':

    image_path = "./images/testaaa.png"
    user_prompt = "识别图片中的内容"


    base64_image = convert_image_to_webp_base64(image_path)
    if not base64_image:
        print("图片转换失败，请检查路径和格式")
        exit()

    execute_ocr_process(base64_image,user_prompt)

