/**
 * Created by alykoshin on 28.06.16.
 */

'use strict';

var util = require('util');
var chalk = require('chalk');
var AsteriskManager = require('asterisk-manager');

var dispatcher = require('./dispatcher');
var credentials = require('./credentials.json');


// var ami = new AsteriskManager('5038','localhost','hello','world', true);
var ami = new AsteriskManager(
  '5038',
  '178.57.222.131',
  credentials.ami.username,
  credentials.ami.password,
  true
);

ami.keepConnected();


ami.actionComplete = function(msg, completeEvent, callback) {
  if (arguments.length === 2) {
    callback = completeEvent;
    completeEvent = msg.action+'Complete';
  }
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
        callback(undefined, data, res, evt);
        return;
      }
      data.push(evt);
    };

    var ACTION_LIST_TIMEOUT = 3000;
    timer = setTimeout(function() {
      var err = 'No complete message in ' + ACTION_LIST_TIMEOUT + ' mseconds; action: '+msg.action+', actionid: '+res.actionid;
      // console.log('>>> '+chalk.green('action: agents: agentscomplete')+': ' +
      //   chalk.red(' err: ' + err) + ' actionid: '+res.actionid );
      cleanup();
      callback(err);
    }, ACTION_LIST_TIMEOUT);

    ami.on('managerevent', onManagerEvent);

  });

};


ami.on('connect', function() {
  console.log('<<< '+chalk.yellow('connect'));
});

ami.on('close', function(evt) {
  console.log('<<< '+chalk.yellow('close') + chalk.grey(': '+JSON.stringify(evt)));
});

ami.on('end', function(evt) {
  console.log('<<< '+chalk.yellow('end') + chalk.grey(': '+JSON.stringify(evt)));
});

ami.on('data', function(evt) {
  console.log('<<< '+chalk.yellow('data') + chalk.grey(': '+JSON.stringify(evt)));
});

ami.on('error', function(evt) {
  console.log('<<< '+chalk.yellow('error') + chalk.grey(': '+JSON.stringify(evt)));
});


ami.on('rawevent', function(evt) {
  console.log('<<< '+chalk.yellow('rawevent') + chalk.grey(': '+JSON.stringify(evt)));
});


ami.on('asterisk', function(evt) {
  console.log('<<< '+chalk.yellow('asterisk') + chalk.grey(': '+JSON.stringify(evt)));
});


// Listen for any/all AMI events.
ami.on('managerevent', function(evt) {
  var msg = '<<< '+chalk.blue('managerevent: '+evt.event+'');
  if (evt.event !== 'RTCPReceived' && evt.event !== 'RTCPSent') {
    msg += chalk.grey(': '+JSON.stringify(evt));
  }
  console.log(msg);
});


// Listen for specific AMI events. A list of event names can be found at
// https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events
ami.on('hangup', function(evt) {
  console.log('<<< '+chalk.blue('hangup ') + chalk.grey(': '+JSON.stringify(evt)));
});



ami.on('extensionstatus', function(evt) {
  console.log('<<< '+chalk.blue('extensionstatus ') + chalk.grey(': '+JSON.stringify(evt)));
  dispatcher.emit('ami:extensionstatus', evt);
});

ami.on('devicestatechange', function(evt) {
  console.log('<<< '+chalk.blue('devicestatechange ') + chalk.grey(': '+JSON.stringify(evt)));
  dispatcher.emit('ami:devicestatechange', evt);
});



ami.on('confbridgejoin', function(evt) {
  console.log('<<< '+chalk.blue('confbridgejoin ') + chalk.grey(': ' + JSON.stringify(evt)));
});


// Listen for Action responses.
ami.on('response', function(evt) {
  console.log('<<< '+chalk.blue('response ') + chalk.grey(': ' + JSON.stringify(evt)));
});

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

dispatcher.on('ws:extensionstate', function(data, callback) {

  ami.action({
    'action': 'ExtensionState',
    'context': 'from_internal',
    'exten': data.phone,
  }, function(err, res) {
    console.log('>>> '+chalk.green('action: ExtensionState')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });

});

dispatcher.on('ws:queueadd', function(data, callback) {

  ami.action({
    action: 'QueueAdd',
    queue: data.queue,
    interface: data.phone,
  //     Action: QueueAdd
  //     ActionID: <value>
  //   Queue: <value>
  // Interface: <value>
  // Penalty: <value>
  // Paused: <value>
  // MemberName: <value>
  // StateInterface: <value>
}, function(err, res) {
    console.log('>>> '+chalk.green('action: QueueAdd')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });

});

dispatcher.on('ws:queueremove', function(data, callback) {

  ami.action({
    action: 'QueueRemove',
    queue: data.queue,
    interface: data.phone,
}, function(err, res) {
    console.log('>>> '+chalk.green('action: QueueRemove')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });

});

dispatcher.on('ws:queuepause', function(data, callback) {

  ami.action({
    action: 'QueuePause',
    queue: data.queue,
    interface: data.phone,
    paused: data.paused,
}, function(err, res) {
    console.log('>>> '+chalk.green('action: QueuePause')+': ' +
      ' err:' + chalk.red(JSON.stringify(err)) + '' +
      ', res: ' + JSON.stringify(res));
    callback(err, res);
  });

});

//
// ami.action({
//   'action': 'CoreStatus',
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: CoreStatus')+': ' +
//     ' err:' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
// });

// ami.action({
//   'action': 'QueueStatus',
//   // 'Queue': <value>
//   // 'Member': <value>
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: QueueStatus')+': ' +
//     ' err:' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
// });
ami.actionComplete({
    'action': 'QueueStatus',
    // 'Queue': <value>
    // 'Member': 'SIP/200'
  },
  // 'QueueStatusComplete',
  function(err, data, response, complete) {
    console.log('>>> '+chalk.green('action: QueueStatus')+': ' +
      ' err: ' + chalk.red(JSON.stringify(err)) + '' +
      ', response: ' + JSON.stringify(response) + '' +
      ', data: '     + JSON.stringify(data) + '' +
      ', complete: ' + JSON.stringify(complete)
    );
  }
);

// ami.action({
//   'Action': 'QueueSummary',
//   // 'Queue': <value>
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: QueueSummary')+': ' +
//     ' err:' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
// });


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
    console.log('>>> '+chalk.green('action: Agents')+': ' +
      ' err: ' + chalk.red(JSON.stringify(err)) + '' +
      ', response: ' + JSON.stringify(response) + '' +
      ', data: '     + JSON.stringify(data) + '' +
      ', complete: ' + JSON.stringify(complete)
    );
  }
);

// ami.action({
//   'Action': 'Agents',
// }, function(err, res) {
//   console.log('>>> '+chalk.green('action: Agents')+': ' +
//     ' err: ' + chalk.red(JSON.stringify(err)) + '' +
//     ', res: ' + JSON.stringify(res));
//
//   var agents = [];
//   var timer = null;
//
//   var cleanup = function() {
//     ami.removeListener('agents', onAgents);
//     ami.removeListener('agentscomplete', onAgentsComplete);
//     if (timer) {
//       clearTimeout(timer);
//       timer = null;
//     }
//   };
//
//   var onAgents = function(evt) {
//     // console.log('onAgents actionid: '+res.actionid);
//     if (evt.actionid !== res.actionid) {
//       return;
//     }
//     agents.push(evt);
//   };
//
//   var onAgentsComplete = function(evt) {
//     // console.log('onAgentsComplete actionid: '+res.actionid);
//     if (evt.actionid !== res.actionid) {
//       return;
//     }
//     cleanup();
//     console.log('>>> '+chalk.green('action: agents: agentscomplete')+': ' +
//       ' res: ' + JSON.stringify(agents));
//   };
//
//   var ACTION_LIST_TIMEOUT = 5000;
//   timer = setTimeout(function() {
//     console.log('>>> '+chalk.green('action: agents: agentscomplete')+': ' +
//       chalk.red(' err: No complete in ' + ACTION_LIST_TIMEOUT + ' mseconds') + ' actionid: '+res.actionid );
//     cleanup();
//   }, ACTION_LIST_TIMEOUT);
//
//   ami.on('agents', onAgents);
//   ami.on('agentscomplete', onAgentsComplete);
//
// });
//


module.exports = ami;
