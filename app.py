import os
import time
import logging
from flask import Flask, render_template, request, jsonify
from ocr import convert_image_bytes_to_webp_base64, execute_ocr_process

logging.basicConfig(level=logging.INFO)
app = Flask(__name__, static_folder='static', template_folder='templates')

# 默认提示词
DEFAULT_PROMPT = (
    "你现在是一名作业批改机器人，必须严格按照以下规则工作：\n"
    "完整的识别图片中的文本内容，如果图片中有题目(有问句，选项，填空等)，以及作答内容"
    "请批改作业，指出错误并给出正确答案，最后总结错误类型并给出改进建议。\n"
    "如果不是题目，只需要对文本OCR识别结果进行输出。\n"
)

@app.route('/')
def index():
    return render_template('index.html', default_prompt=DEFAULT_PROMPT)

@app.route('/api/ocr', methods=['POST'])
def api_ocr():
    # 支持批量上传：获取所有名为 'image' 的文件
    files = request.files.getlist('image')
    if not files:
        return jsonify({'error': 'no image uploaded'}), 400

    # 始终使用后端硬编码的提示词，忽略前端传入的任何 prompt
    prompt = DEFAULT_PROMPT

    results = []
    total_start = time.time()

    for f in files:
        try:
            img_bytes = f.read()
            base64_image = convert_image_bytes_to_webp_base64(img_bytes)
            if not base64_image:
                results.append({'filename': f.filename, 'error': 'image conversion failed'})
                continue

            start = time.time()
            app.logger.info(f"OCR request: filename={f.filename} size={len(img_bytes)} bytes prompt={prompt}")
            result_text = execute_ocr_process(base64_image, prompt)
            elapsed = int((time.time() - start) * 1000)
            app.logger.info(f"OCR response: filename={f.filename} length={len(result_text)} chars elapsed={elapsed}ms")
            results.append({'filename': f.filename, 'result': result_text, 'elapsed_ms': elapsed})
        except Exception as e:
            app.logger.exception('OCR failed for %s', getattr(f, 'filename', '<unknown>'))
            results.append({'filename': getattr(f, 'filename', '<unknown>'), 'error': str(e)})

    total_elapsed = int((time.time() - total_start) * 1000)
    return jsonify({'results': results, 'total_elapsed_ms': total_elapsed})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
