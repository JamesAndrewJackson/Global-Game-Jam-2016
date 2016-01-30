import datetime as dt
import time
from multiprocessing import Process, Value
from threading import Thread
from flask import Flask, render_template, session, request
from flask_socketio import SocketIO, emit, send, join_room, leave_room, \
    close_room, rooms, disconnect
from time import sleep

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecret4294!'
socketio = SocketIO(app)
demon_percent = Value('d', 0.0)
demon_rate = Value('d', 0.01)
rate_increase = Value('d', 0.001) 
push_times = Value('i', 0)
start_time = dt.datetime.now()
high_score = 0
dead = False

def count_down(demon_percent, demon_rate, rate_increase, push_times):
    while True:
        demon_percent.value += demon_rate.value/100.0
        if demon_percent.value >= 1.0:
            sleep(5)
            demon_percent.value = 0.0
            demon_rate.value = 0.01
            rate_increase.value = 0.001
            push_times.value = 0
        sleep(0.01)

@socketio.on('my event')
def test_message(message):
    emit('my response', {'data': 'got it!'})

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('push button')
def broadcast_message(message):
    global demon_percent, demon_rate, rate_increase, push_times, start_time, high_score, dead
    print 'SUPER MESSAGE'
    if demon_percent.value >= 1.0:
        if dead is False:
            now_time = dt.datetime.now()
            demon_time = (now_time - start_time).seconds
            if demon_time > high_score:
                high_score = demon_time
        dead = True
    else:
        if dead is True:
            print 'dead is true'
            start_time = dt.datetime.now()
            dead = False
        now_time = dt.datetime.now()
        demon_time = (now_time - start_time).seconds
        push_times.value = push_times.value + 1
        demon_percent.value -= message['percent_increase']
        if demon_percent.value <= 0.0:
            demon_percent.value = 0.0
        
        rate_increase.value = 1.0/(push_times.value + 1000)
        demon_rate.value += rate_increase.value
       
        emit('demon stats',
             {'demon_percent': demon_percent.value, 'demon_rate': demon_rate.value, 'demon_time': demon_time, 'high_score': high_score},
             broadcast=True)

@socketio.on('connect')
def connect():
    global demon_percent, demon_rate, rate_increase, push_times, start_time, high_score, dead
    now_time = dt.datetime.now()
    demon_time = (now_time - start_time).seconds
    print str(demon_percent)
    percent = demon_percent.value
    rate = demon_rate.value
    emit('connect info', {'demon_percent': percent, 'demon_rate': rate, 'demon_time': demon_time, 'high_score': high_score})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected', request.sid)

if __name__ == '__main__':
    demon = Process(target=count_down, args=(demon_percent, demon_rate, rate_increase, push_times))
    demon.start()
    socketio.run(app, host='0.0.0.0', port=80, debug=False)
