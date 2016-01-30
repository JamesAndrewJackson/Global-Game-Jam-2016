from flask import Flask, render_template, request
app = Flask(__name__)

number = 0

@app.route('/number', methods=['GET', 'POST'])
def get_number():
    global number
    if request.method == 'POST':
        number += 1
        return str(number)
    else:
        return str(number)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
