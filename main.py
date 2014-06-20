#!/usr/bin/python
import mosquitto  
import time
import os
import sys

class Sockets:
    commands = {
        '1': {'on': '15', 'off': '14'},
        '2': {'on':  '7', 'off':  '6'},
        '3': {'on': '11', 'off': '10'}
    }

    def __init__(self):
        self.client = mosquitto.Mosquitto("sockets")

    def on_message(self, mosq, obj, msg):
        try:
            id = msg.topic.split('/')[2]
            command = msg.payload.decode("utf-8")
            code = Sockets.commands[id][command]
            os.system("/home/hasi/raspberry-remote/codesend " + code)
            self.client.publish("hasi/sockets/" + id + "/state", str(command), 0, True)
        except:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            print(str(exc_value))

    def reset(self):
        print('Resetting.')

        self.client = mosquitto.Mosquitto("sockets")
        self.client.connect("atlas.hasi", 1883, 60)
        self.client.on_message = self.on_message
        #self.client.publish("hasi/events", "sockets online")
        self.client.subscribe("hasi/sockets/+/set_state")

    def loop_forever(self):
        while True:
            try:
                while self.client.loop(100) == 0:
                    pass
                else:
                    self.reset()
            except:
                exc_type, exc_value, exc_traceback = sys.exc_info()
                print(str(exc_value))
                time.sleep(1000)

sockets = Sockets()
sockets.loop_forever()
