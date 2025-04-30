from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/hello')
def hello():
    return "Hello from Flask!"

if __name__ == '__main__':
    print("Starting test Flask server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
