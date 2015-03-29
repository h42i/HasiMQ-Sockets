HasiMQ-Sockets
==============

Node.js based implementation of an MQTT-socket to i2c interface.

# Dependencies
* node-i2c (https://github.com/kelly/node-i2c)
* mqtt
* sleep

# Install

HasiMQ-Sockets runs on an ARMv6 system and only Node.js version <= 0.11 is
supported.

To install the modules run
> $ npm install i2c@0.1.8

Adjust the paths in the HasiMQ-Sockets.service file and copy the file to either
> /usr/lib/systemd/system/
or
> /etc/systemd/system/

# Run

Enable systemd service via
> $ systemctl enable HasiMQ-Sockets.service
and start with
> $ systemctl start HasiMQ-Sockets.service

# Issues

Currently neither keepalive signal or success codes are implemented for the
i2c device. It is therefore not possible to determine, if the i2c payload was
recieved.
