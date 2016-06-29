/**
 * Created by alykoshin on 28.06.16.
 */

'use strict';

var io = require('socket.io');

var dispatcher = require('./dispatcher');


module.exports = function (server) {
  var options = {};
  var ioSocket  = io.listen(server, options);

  ioSocket.on('error', function(data) {
    console.log(data);
  });

  ioSocket.on('connection', function(socket) {

    socket.on('message', function (data, callback) {
      console.log('on(message): data:', data);
      
      if (data.name === 'test:extensionstate') {
        dispatcher.emit('ws:extensionstate', data, function(err, res) {
          callback(err, res);
        });
      }
      
      if (data.name === 'test:queueadd') {
        dispatcher.emit('ws:queueadd', data, function(err, res) {
          callback(err, res);
        });
      }

      if (data.name === 'test:queueremove') {
        dispatcher.emit('ws:queueremove', data, function(err, res) {
          callback(err, res);
        });
      }

     if (data.name === 'test:queuepause') {
        dispatcher.emit('ws:queuepause', data, function(err, res) {
          callback(err, res);
        });
      }

      if (data.name === 'test:subscribe') {
        dispatcher.on(data, function(err, res) {
          callback(err, res);
        });
      }

    });

    dispatcher.on('ami:devicestatechange', function(data, callback) {
      // console.log('!!!!!!!!!!!!!!!!!!!!!!');
      socket.emit('ami:devicestatechange', { raw: data }, callback);
    });

     dispatcher.on('ami:extensionstatus', function(data, callback) {
      // console.log('!!!!!!!!!!!!!!!!!!!!!!');
      socket.emit('ami:extensionstatus', { raw: data }, callback);
    });

    socket.send('test');

  });
};

