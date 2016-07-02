/**
 * Created by alykoshin on 28.06.16.
 */

'use strict';

var util = require('util');
var debug = require('debug')('ami');
var debug_row = require('debug')('raw');
var chalk = require('chalk');
var AsteriskManager = require('asterisk-manager');

var dispatcher = require('./dispatcher');
var credentials = require('../credentials.json');


// var ami = new AsteriskManager('5038','localhost','hello','world', true);
var ami = new AsteriskManager(
  '5038',
  // '178.57.222.131',
  'localhost',
  credentials.ami.username,
  credentials.ami.password,
  true
);

ami.keepConnected();


ami._action = ami.action;
ami.action = function(msg, callback/* arguments */) {
  var args = Array.prototype.slice.call(arguments);
  debug(chalk.green('>>> action: ' + JSON.stringify(args[0])));
  // ami._action.apply(this, arguments);
  ami._action(msg, function(err,res) {
    debug('<<< '+chalk.green('action: PresenceState')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });
};

ami.actionComplete = function(msg, completeEvent, callback) {
  if (arguments.length === 2) {
    callback = completeEvent;
    completeEvent = msg.action+'Complete';
  }
  debug(chalk.green('>>> actionComplete: ' + JSON.stringify(msg)+', completeEvent:'+completeEvent));
  // if (typeof completeEvents === 'string') { completeEvents = [completeEvents]; }

  ami.action(msg, function(err, res) {
    var data = [];
    var timer = null;

    var cleanup = function() {
      ami.removeListener('managerevent', onManagerEvent);
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    var onManagerEvent = function(evt) {
      // console.log('actionComplete(): onManagerEvent event: '+evt.event+', actionid: '+evt.actionid);
      if (evt.actionid !== res.actionid) {
        return;
      }
      // if (completeEvents.indexOf(evt.event) > -1) {
      if (completeEvent === evt.event) {
        cleanup();
        debug('actionComplete: completeEvent');
        callback(undefined, data, res, evt);
        return;
      }
      data.push(evt);
    };

    if (err) {
      callback(err);
      return;
    }

    var ACTION_LIST_TIMEOUT = 3000;
    timer = setTimeout(function() {
      cleanup();
      var err = 'No complete message in ' + ACTION_LIST_TIMEOUT + ' mseconds; action: '+msg.action+', actionid: '+res.actionid;
      // console.log('>>> '+chalk.green('action: agents: agentscomplete')+': ' +
      //   chalk.red(' err: ' + err) + ' actionid: '+res.actionid );
      callback(err);
    }, ACTION_LIST_TIMEOUT);

    ami.on('managerevent', onManagerEvent);

  });

};


ami.on('connect', function() {
  debug('<<< '+chalk.yellow('connect'));
});

ami.on('close', function(evt) {
  debug('<<< '+chalk.yellow('close') + chalk.grey(': '+JSON.stringify(evt)));
});

ami.on('end', function(evt) {
  debug('<<< '+chalk.yellow('end') + chalk.grey(': '+JSON.stringify(evt)));
});

ami.on('data', function(evt) {
  debug('<<< '+chalk.yellow('data') + chalk.grey(': '+JSON.stringify(evt)));
});

ami.on('error', function(evt) {
  debug('<<< '+chalk.red('error') + chalk.grey(': '+JSON.stringify(evt)));
});


ami.on('rawevent', function(evt) {
  debug_row('<<< '+chalk.yellow('rawevent') + chalk.grey(': '+JSON.stringify(evt)));
});


ami.on('asterisk', function(evt) {
  debug_row('<<< '+chalk.yellow('asterisk') + chalk.grey(': '+JSON.stringify(evt)));
});


// Listen for any/all AMI events.
ami.on('managerevent', function(evt) {
  // var msg = '<<< '+chalk.blue('managerevent: '+evt.event+'');
  // var msg = '<<< '+chalk.white('managerevent: '+evt.event+'');
  var msg = evt.event;
  if (evt.event !== 'RTCPReceived' && evt.event !== 'RTCPSent') {
    msg += chalk.grey(': '+JSON.stringify(evt));
  }
  dispatcher.publish('ami', evt);
  debug('<<< '+'managerevent: ' + msg);
});


// Listen for specific AMI events. A list of event names can be found at
// https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events
// ami.on('hangup', function(evt) {
// debug('<<< '+chalk.blue('hangup ') + chalk.grey(': '+JSON.stringify(evt)));
// });



// ami.on('extensionstatus', function(evt) {
// debug('<<< '+chalk.blue('extensionstatus ') + chalk.grey(': '+JSON.stringify(evt)));
// dispatcher.emit('ami:extensionstatus', evt);
// });

// ami.on('devicestatechange', function(evt) {
// debug('<<< '+chalk.blue('devicestatechange ') + chalk.grey(': '+JSON.stringify(evt)));
// dispatcher.emit('ami:devicestatechange', evt);
// });



// ami.on('confbridgejoin', function(evt) {
//   debug('<<< '+chalk.blue('confbridgejoin ') + chalk.grey(': ' + JSON.stringify(evt)));
// });


// Listen for Action responses.
// ami.on('response', function(evt) {
//   debug('<<< '+chalk.blue('response ') + chalk.grey(': ' + JSON.stringify(evt)));
// });

// Perform an AMI Action. A list of actions can be found at
// https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Actions
// ami.action({
//   'action': 'originate',
//   'channel': 'SIP/200',
//   // 'context': 'default',
//   'context': 'from_internal',
//   'exten': 200,
//   'priority': 1,
//   'async': true,
//   'variable': {
//     'name1': 'value1',
//     'name2': 'value2'
//   }
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: originate')+': ' +
//     ' err:' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
// });

dispatcher.on('ws:corestatus', function(data, callback) {
  ami.action({
    'action': 'CoreStatus',
  }, function (err, res) {
    debug('<<< ' + chalk.green('action: CoreStatus') + ': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });
});


dispatcher.on('ws:extensionstate', function(data, callback) {
  ami.action({
    'action':  'ExtensionState',
    'context': 'from_internal',
    'exten':    data.phone,
  }, function(err, res) {
    debug('<<< '+chalk.green('action: ExtensionState')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });
});

dispatcher.on('ws:presencestate', function(data, callback) {
  // Action: PresenceState
  // ActionID: <value>
  // Provider: <value>
  ami.action({
    'action':  'PresenceState',
    'provider':  'CustomPresence',
    // 'provider':  'SIP',
  }, function(err, res) {
    debug('<<< '+chalk.green('action: PresenceState')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });
});

dispatcher.on('ws:queueadd', function(data, callback) {
  var queue = data.queue;
  var device = 'SIP/'+data.phone;
  ami.action({
    action:    'QueueAdd',
    queue:     queue,
    interface: device,
    MemberName: 'Agent/xxx',
    //     Action: QueueAdd
    //     ActionID: <value>
    //   Queue: <value>
    // Interface: <value>
    // Penalty: <value>
    // Paused: <value>
    // MemberName: <value>
    // StateInterface: <value>
  }, function(err, res) {
    debug('<<< '+chalk.green('action: QueueAdd')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });

});

dispatcher.on('ws:queueremove', function(data, callback) {
  var queue = data.queue;
  var device = 'SIP/'+data.phone;
  ami.action({
    action:    'QueueRemove',
    queue:     queue,
    interface: device,
  }, function(err, res) {
    debug('<<< '+chalk.green('action: QueueRemove')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });

});

dispatcher.on('ws:queuepause', function(data, callback) {
  var queue = data.queue;
  var device = 'SIP/'+data.phone;
  ami.action({
    action:    'QueuePause',
    queue:     queue,
    interface: device,
    paused:    data.paused,
  }, function(err, res) {
    console.log('<<< '+chalk.green('action: QueuePause')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });
});

dispatcher.on('ws:queuestatus', function(data, callback) {
  var queue = data.queue;
  ami.actionComplete({
      'action': 'QueueStatus',
      'Queue':   queue
    },
    function (err, res, response, complete) {
      debug('<<< ' + chalk.green('[ami] queuestatus') + ': ' +
        ' err: ' + chalk.red(JSON.stringify(err)) + '' +
        ', response: ' + JSON.stringify(response) + '' +
        ', res: ' + JSON.stringify(res) + '' +
        ', complete: ' + JSON.stringify(complete)
      );
      callback(err, res);
    }
  );
});

dispatcher.on('ws:queuememberstatus', function(data, callback) {
  console.log('dispatcher:, ws:queuememberstatus: data: '+JSON.stringify(data));
  var queue = data.queue;
  var device = 'SIP/'+data.phone;
  ami.actionComplete({
      'action': 'QueueStatus',
      'Queue':   queue,
      // 'Member':  device
      'stateinterface':  device
    },
    function (err, res, response, complete) {
      debug('<<< ' + chalk.green('[ami] queuememberstatus:') + ': ' +
        ' err: ' + chalk.red(JSON.stringify(err)) + '' +
        ', response: ' + JSON.stringify(response) + '' +
        ', res: ' + JSON.stringify(res) + '' +
        ', complete: ' + JSON.stringify(complete)
      );
      callback(err, res);
    }
  );
});

// ami.action({
//   'Action': 'QueueSummary',
//   // 'Queue': <value>
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: QueueSummary')+': ' +
//     ' err:' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
// });

ami.actionComplete({
    'Action': 'DeviceStateList',
  },  'DeviceStateListComplete',
  function(err, data, response, complete) {
    debug('<<< '+chalk.white.bold('action: DeviceStateList: response')+': ' +
      ' err: ' + chalk.red(JSON.stringify(err)) + '' +
      ', response: ' + JSON.stringify(response) + '' +
      ', data: '     + JSON.stringify(data) + '' +
      ', complete: ' + JSON.stringify(complete)
    );
  }
);


// Looks like response to Queue action is not typical and is not handled by asterisk-manager package
// ami.action({
//   'action': 'Queues',
//   // 'Queue': <value>
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: Queues')+': ' +
//     ' err:' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
// });

ami.actionComplete({
    'action': 'Agents',
  },
  // 'AgentsComplete',
  function(err, data, response, complete) {
    debug('<<< '+chalk.white.bold('action: Agents: response')+': ' +
      ' err: ' + chalk.red(JSON.stringify(err)) + '' +
      ', response: ' + JSON.stringify(response) + '' +
      ', data: '     + JSON.stringify(data) + '' +
      ', complete: ' + JSON.stringify(complete)
    );
  }
);

//

module.exports = ami;
