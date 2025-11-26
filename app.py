from flask import Flask, render_template, request, jsonify
from ocr import convert_image_bytes_to_webp_base64, execute_ocr_process

app = Flask(__name__, static_folder='static', template_folder='templates')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/ocr', methods=['POST'])
def api_ocr():
    if 'image' not in request.files:
        return jsonify({'error': 'no image uploaded'}), 400

    file = request.files['image']
    img_bytes = file.read()
    base64_image = convert_image_bytes_to_webp_base64(img_bytes)
    if not base64_image:
        return jsonify({'error': 'image conversion failed'}), 500

    prompt = request.form.get('prompt', '识别图片中的内容')
    try:
        result = execute_ocr_process(base64_image, prompt)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
