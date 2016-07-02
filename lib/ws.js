/**
 * Created by alykoshin on 28.06.16.
 */

'use strict';

var io = require('socket.io');
var debug = require('debug')('ws');

var dispatcher = require('./dispatcher');


module.exports = function (server) {
  var options = {};
  var ioSocket  = io.listen(server, options);

  ioSocket.on('error', function(data) {
    console.error(data);
  });

  ioSocket.on('connection', function(socket) {



    // !!! need to unsubscribe on disconnect to release resources


    socket.on('message', function (data, callback) {
      debug('on(message): data:', data);

      var exten = data.exten;
      var device = 'SIP/' + data.exten;


      if (data.name === 'test:subscribe') {
        dispatcher.subscribe('ami', [ {
          event: 'DeviceStateChange',
          device: device
        }, {
          event: 'ExtensionStatus',
          exten:  exten
        }, {
          event: 'QueueMember',
          stateinterface:  device
        }, {
          event: 'QueueMemberStatus',
          stateinterface:  device
        }, {
          event: 'AgentCalled',
          interface:  device
       }, {
          event: 'AgentConnect',
          interface:  device
       }, {
          event: 'AgentComplete',
          interface:  device
       }, {
          event: 'AgentRingNoAnswer',
          interface:  device
        }], function(source, event, callback) {
          debug('on(message): emit: source:' + source + ', event: '+JSON.stringify(event));
          // if ([
          //     'DeviceStateChange',
          //     'ExtensionStatus',
          //     'QueueMember',
          //     'QueueMemberStatus',
          //     'AgentRingNoAnswer',
          //   ].indexOf(event.event) > -1) {
            var eventName = 'ami:'+  event.event.toLowerCase();
            socket.emit(eventName, { raw: event });
          // }
        });

        callback(null);
      }


      // if ([
      //     'test:extensionstate',
      //     'test:queueadd',
      //     'test:queueremove',
      //     'test:queuepause',
      //     'test:corestatus',
      //     'test:queuestatus',
      //     'test:queuememberstatus',
      //   ].indexOf(data.name) > -1) {
        var eventName = data.name.replace(/^test:/, 'ws:');
        dispatcher.emit(eventName, data, function(err, res) {
          callback(err, res);
        });
      // }


      // if (data.name === 'test:extensionstate') {
      //    dispatcher.emit('ws:extensionstate', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }
      //
      //  if (data.name === 'test:queueadd') {
      //    dispatcher.emit('ws:queueadd', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }
      //
      //  if (data.name === 'test:queueremove') {
      //    dispatcher.emit('ws:queueremove', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }
      //
      //  if (data.name === 'test:queuepause') {
      //    dispatcher.emit('ws:queuepause', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }
      //
      //   if (data.name === 'test:corestatus') {
      //    dispatcher.emit('ws:corestatus', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }
      //
      //   if (data.name === 'test:queuestatus') {
      //    dispatcher.emit('ws:queuestatus', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }
      //
      //   if (data.name === 'test:queuememberstatus') {
      //    dispatcher.emit('ws:queuememberstatus', data, function(err, res) {
      //      callback(err, res);
      //    });
      //  }

      //

    });


    socket.send('test');

  });
};

