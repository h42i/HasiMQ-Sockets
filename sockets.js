#!/usr/bin/env node
var mqtt = require('mqtt');
var child_process = require('child_process');

var exec = child_process.exec;

var port = 1883;
var host = 'atlas.hasi';

var sockets = {
	1: { 'on': 15, 'off': 14 },
	2: { 'on': 7, 'off': 6 },
	3: { 'on': 11, 'off': 10 }
};

client = mqtt.createClient(port, host);
client.subscribe('hasi/sockets/+/set_state');

client.on('message', function (topic, message) {
	socket = parseInt(topic.split('/')[2]);

	if (socket in sockets) {
		if (message === 'on' || message === 'off') {
			console.log('Switching socket ' + socket + ' ' + message + '.');
			
			exec('/home/hasi/raspberry-remote/codesend ' + sockets[socket][message]);
		}
	}
});
