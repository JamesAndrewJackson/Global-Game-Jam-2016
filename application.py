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
calc_second = Value('i', 0)
start_time = dt.datetime.now()
win_time = Value('i', 0)
high_score = 0
dead = False

def count_down(demon_percent, demon_rate, rate_increase, push_times, calc_second, win_time):
    while True:
        if win_time.value == 0:
            demon_percent.value += demon_rate.value
        if demon_percent.value >= 1.0:
            win_sec = dt.datetime.now().second
            win_min = dt.datetime.now().minute
            win_time.value = (win_min * 60) + win_sec
            demon_rate.value = 0.01
            rate_increase.value = 0.001
            push_times.value = 0
        calc_second.value = dt.datetime.now().microsecond
        #socketio.emit('demon percent', {'demon_percent': demon_percent.value})
        sleep(1)

@socketio.on('my event')
def test_message(message):
    emit('my response', {'data': 'got it!'})

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('push button')
def broadcast_message(message):
    global demon_percent, demon_rate, rate_increase, push_times, start_time, high_score, dead, calc_second, win_time
    if demon_percent.value >= 1.0:
        if win_time.value > 0:
            start_min = start_time.minute
            start_sec = start_time.second
            start_calc = (start_min * 60) + start_sec
            demon_time = (win_time.value - start_calc)
            start_time = dt.datetime.now()
            demon_percent.value = 0.0
            win_time.value = 0
            if demon_time > high_score:
                high_score = demon_time
    else:
        now_time = dt.datetime.now()
        demon_time_seconds = (now_time - start_time).seconds
        demon_time_microseconds = (now_time - start_time).microseconds
        demon_time = '{0}.{1}'.format(demon_time_seconds, demon_time_microseconds)
        now_microseconds = now_time.microsecond
        if calc_second.value <= now_microseconds:
            diff_time = now_microseconds - calc_second.value
        else:
            diff_time = (now_microseconds + 1000000) - calc_second.value
        push_times.value = push_times.value + 1
        demon_percent.value -= message['percent_increase']
        if demon_percent.value <= 0.0:
            demon_percent.value = 0.0
        
        rate_increase.value = 1.0/(push_times.value + 2000)
        demon_rate.value += rate_increase.value
       
        real_percent = demon_percent.value + (demon_rate.value * diff_time/1000000.0)
        emit('demon stats',
             {'demon_percent': real_percent, 'demon_rate': demon_rate.value, 'demon_time': demon_time, 'high_score': high_score, 'push_times': push_times.value},
             broadcast=True)

@socketio.on('connect')
def connect():
    global demon_percent, demon_rate, rate_increase, push_times, start_time, high_score, dead
    now_time = dt.datetime.now()
    demon_time = (now_time - start_time).seconds
    print str(demon_percent)
    percent = demon_percent.value
    rate = demon_rate.value
    emit('connect info', {'demon_percent': percent, 'demon_rate': rate, 'demon_time': demon_time, 'high_score': high_score, 'push_times': push_times.value})

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected', request.sid)

if __name__ == '__main__':
    demon = Process(target=count_down, args=(demon_percent, demon_rate, rate_increase, push_times, calc_second, win_time))
    demon.start()
    socketio.run(app, host='0.0.0.0', port=80, debug=False)

