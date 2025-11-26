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