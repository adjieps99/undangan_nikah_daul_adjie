import os
from flask import Flask, render_template, jsonify

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'hachi-garden-3d-wedding-secret-key-2026')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "app": "Hachi Garden 3D Wedding Venue",
        "version": "2.0.2",
        "environment": os.environ.get('FLASK_ENV', 'production')
    }), 200

@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html'), 200

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Internal Server Error", "status": 500}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    print(f"Wedding Invitation Server running at http://0.0.0.0:{port} (debug={debug_mode})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
