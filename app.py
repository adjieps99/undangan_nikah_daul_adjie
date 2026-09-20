import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Wedding Invitation Server running at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
