# OCR 项目

简易的前端 + Flask 后端示例，用于将图片发送给大模型做 OCR（图像识别）。前端提供图片上传、预览和调试面板（显示原始 JSON 响应）。

## 目录
- `app.py` - Flask 后端，提供 `/` 前端页面和 `/api/ocr` 上传接口。
- `ocr.py` - 图片处理与调用模型的逻辑（将图片编码为 WebP base64 并调用 OpenAI 兼容 SDK）。
- `templates/index.html` - 前端页面，含调试面板与图片预览。
- `requirements.txt` - Python 依赖。

## 要求
- Python 3.10+（推荐）
- Windows / PowerShell 下的虚拟环境（示例使用 `.venv`）

## 安装（PowerShell）
```powershell
# 进入项目根目录
cd F:\Github\ocr

# 可选：创建虚拟环境（如果尚未创建）
python -m venv .venv

# 激活虚拟环境
& .\.venv\Scripts\Activate.ps1

# 安装依赖
pip install -r requirements.txt
```

## 配置环境变量
建议不要在代码中写明 API Key，请使用环境变量方式传入。示例（PowerShell）：

```powershell
$env:OPENAI_API_KEY = "sk-你的密钥"
# 可选：覆盖后端默认提示词
$env:DEFAULT_PROMPT = "请识别图片中的文本并返回纯文本"
```

注意：`ocr.py` 中目前含有一个回退的硬编码 key（用于开发方便），请在生产或公开仓库前删除该回退 key。

## 运行应用
```powershell
# 在虚拟环境激活状态下
python .\app.py
```
应用默认监听 `http://0.0.0.0:5000/`，在本机用浏览器打开：

```
http://localhost:5000/
```

## 使用说明（前端）
- 选择图片文件（支持常见图片格式），页面会显示预览。
- 可在提示词输入框里编辑提示（默认从后端 `DEFAULT_PROMPT` 注入）。
- 点击“上传并识别”，左侧显示识别文本，右侧调试面板显示后端返回的原始 JSON。

## API 说明
- POST `/api/ocr` - 接收 multipart/form-data，字段：
  - `image` (file) - 要识别的图片
  - `prompt` (string, optional) - 覆盖默认提示词

响应（成功）示例：
```json
{ "result": "识别文本...", "elapsed_ms": 1234 }
```

失败时会返回类似：
```json
{ "error": "错误信息", "elapsed_ms": 456 }
```

## 常见问题
- 浏览器报错 `Failed to fetch` 且路径为 `file:///...`：说明你是直接用浏览器打开 `index.html`（file:// 协议）。请确保通过 HTTP 访问（例如运行 `python .\app.py` 然后访问 `http://localhost:5000/`），不要直接用 file://。
- 模型报错 `context length / tokens`：请使用较小的图片或裁剪图片。项目中已对上传图片做缩放与压缩（最长边默认 1024px，WebP 质量 60）以减小 base64 大小。如果仍然过大，建议在前端裁剪或在后端检查并提示用户。
- 如果需要从不同域访问后端，请在 `app.py` 中启用 CORS（添加 `Flask-Cors` 并配置 `CORS(app)`）。

## 开发与调试建议
- 日志：`app.py` 使用 `logging` 打印请求信息和耗时。
- 如果后端提供 `mock` 功能已移除，当前默认会直接调用线上模型，请确保 `OPENAI_API_KEY` 可用并有调用额度。
- 若想避免将图片直接编码进请求（导致消息太大），考虑将图片上传到临时存储（如 S3 或其他可公开访问 URL），然后把图片 URL 提交给模型，或使用 provider 支持的文件/multipart 上传接口。

## 可选项
- 将依赖固定到当前环境：
```powershell
pip freeze > requirements.txt
```
- 启用 CORS（跨域访问）：
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

---
如果需要我把 README 翻译成英文或加入更多使用示例（例如 curl 调用示例、前端截图、CI 配置），告诉我你想要的内容，我会继续完善。
