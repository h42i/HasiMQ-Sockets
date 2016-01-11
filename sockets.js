#!/usr/bin/env node
var mqtt = require('mqtt');
var i2c = require('i2c');
var child_process = require('child_process');
var sleep = require('sleep');

var exec = child_process.exec;

var port = 1883;
var host = 'atlas.hasi';
var topic = 'hasi/sockets/+/set';

var sockets = {
    1: { 'type': 'dip', 'system_code': parseInt('00000', 2), 'unit_code': parseInt('10000', 2), 'pulse_length': 340, 'repeats': 15 },
    2: { 'type': 'dip', 'system_code': parseInt('00000', 2), 'unit_code': parseInt('01000', 2), 'pulse_length': 340, 'repeats': 15 },
    3: { 'type': 'dip', 'system_code': parseInt('00000', 2), 'unit_code': parseInt('11000', 2), 'pulse_length': 340, 'repeats': 15 },
    4: { 'type': 'dip', 'system_code': parseInt('00000', 2), 'unit_code': parseInt('00100', 2), 'pulse_length': 340, 'repeats': 15 },
    5: { 'type': 'dip', 'system_code': parseInt('11111', 2), 'unit_code': parseInt('00100', 2), 'pulse_length': 340, 'repeats': 15 },
    6: { 'type': 'dip', 'system_code': parseInt('11111', 2), 'unit_code': parseInt('10000', 2), 'pulse_length': 340, 'repeats': 15 },
    7: { 'type': 'dec', 'on_code': 15, 'off_code': 14, 'pulse_length': 340, 'repeats': 15 },
    8: { 'type': 'dec', 'on_code': 11, 'off_code': 10, 'pulse_length': 340, 'repeats': 15 }
};

var socket_states = {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false
};

var locked = false;

console.log('Starting MQTT client.');

var client = mqtt.createClient(port, host);
client.subscribe(topic);

var address = 0x23;
var wire = new i2c(address, { device: '/dev/i2c-1' });

client.on('message', function (topic, message) {
    console.log('Received message on topic ' + topic + ': ' + message + '.');

    socket = parseInt(topic.split('/')[2]);

    if (socket in sockets) {
        if (message === 'on' || message === 'off') {
            console.log('Switching socket ' + socket + ' ' + message + '.');

            while (locked) {
                sleep.sleep(0.5);
            }

            locked = true;

            var i2c_message = null;

            if (sockets[socket]['type'] === 'dip') {
                var state = message === 'on' ? 1 : 0;
                var system_code = sockets[socket]['system_code'] & 0xFF;
                var unit_code = sockets[socket]['unit_code'] & 0xFF;
                var pulse_high = (sockets[socket]['pulse_length'] >> 8) & 0xFF;
                var pulse_low = sockets[socket]['pulse_length'] & 0xFF;
                var repeats = sockets[socket]['repeats'] & 0xFF;

                i2c_message = new Buffer([state, system_code, unit_code, pulse_high, pulse_low, repeats]);
            } else if (sockets[socket]['type'] === 'dec') {
                var value_high = ((message === 'on' ?
                                   sockets[socket]['on_code'] :
                                   sockets[socket]['off_code']) >> 8) & 0xFF;
                var value_low = (message === 'on' ?
                                 sockets[socket]['on_code'] :
                                 sockets[socket]['off_code']) & 0xFF;

                var pulse_high = (sockets[socket]['pulse_length'] >> 8) & 0xFF;
                var pulse_low = sockets[socket]['pulse_length'] & 0xFF;
                var repeats = sockets[socket]['repeats'] & 0xFF;

                i2c_message = new Buffer([value_high, value_low, pulse_high, pulse_low, repeats]);
            }

            if (i2c_message) {
                wire.write(new Buffer(i2c_message), function(err) {
                    if (err) {
                        console.log('An i2c error occurred: ' + err);
                    }
                });

                sleep.usleep(sockets[socket]['repeats'] * 60000);
            }

            socket_states[socket] = message === 'on' ? true : false;

            locked = false;
        }

        client.publish('hasi/sockets/' + socket + '/get', socket_states[socket] ? 'on' : 'off');
    }
});
