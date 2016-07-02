/**
 * Created by alykoshin on 28.06.16.
 */

/* global window,io,toastr,document,toastr*/

var Link = function(uri, opts) {
  var self = this;

  // temporary backward compatibility
  var socketIO = io();
  window.socketIO = socketIO;
  

  self.on = function(/* arguments */) {
    socketIO.on.apply(socketIO, arguments);
  };

  // self.emit = function(/* arguments */) {
  //   socketIO.emit.apply(socketIO, arguments);
  // };

  self.send = function(/* arguments */) {
    socketIO.send.apply(socketIO, arguments);
  };


  socketIO.on('connect',           function()        { console.log('on(connect)'); });
  socketIO.on('error',             function(error)   { console.log('on(error):', error); });
  socketIO.on('disconnect',        function()        { console.log('on(disconnect)'); });
  socketIO.on('reconnect',         function(attempt) { console.log('on(reconnect):', attempt); });
  socketIO.on('reconnect_attempt', function()        { console.log('on(reconnect_attempt)'); });
  socketIO.on('reconnecting',      function(attempt) { console.log('on(reconnecting):', attempt); });
  socketIO.on('reconnect_error',   function(error)   { console.log('on(reconnect_error):', error); });
  socketIO.on('reconnect_failed',  function()        { console.log('on(reconnect_failed)'); });

  self.connect = function() {
    console.log('connecting...');
    /*socketIO =*/
    io.connect( uri, opts ); // Connection via web-sockets
  };

  self.action = function(name, data, callback) {
    if (typeof callback !== 'function') { callback = function() {}; }
    data.name = 'test:' + name;
    self.send(data, function(err, res) {
      if (err) { console.error('Link.action: err:' + JSON.stringify(err)); return callback(err); }
      console.log('Link.action: name: '+name+', res: ' + JSON.stringify(res));
      return callback(err, res);
    });
  };

  self.subscribe = function(queue, phone, callback) {
    if (typeof callback !== 'function') { callback = function() {}; }
    self.action('subscribe', {
      exten:   phone,
      device: 'SIP/' + phone,
      queue:  queue,
    }, function(err, res) {
      if (err) { console.error('Link.subscribe: err:', err); return callback(err); }
      console.log('Link.subscribe: res:', res);
      return callback(err, res);
    });

  };

  self.doActionExtensionState = function(phone, callback) {
    self.action('extensionstate', { phone: phone }, function(err, res) {
      if (err) { return callback(err); }
      var statusCode = res.status;
      var statusText = res.statustext;
      return callback(err, statusCode, statusText);
    });
  };

  self.connect();

};


//


var Toaster = function() {
  var self = this;
  //
  // Configure `toastr` object
  // https://github.com/CodeSeven/toastr
  //
  self.init = function(toastr) {
    toastr.options.closeButton = true;
    // toastr.options.closeMethod = 'fadeOut';
    toastr.options.showDuration =
      toastr.options.closeDuration =
        toastr.options.hideDuration = 250;
    // toastr.options.closeEasing = 'swing';
    toastr.options.newestOnTop = false;
    toastr.options.timeOut = 5000;
    // toastr.options.showMethod = 'slideDown';
    // toastr.options.hideMethod = 'slideUp';
    // toastr.options.closeMethod = 'slideUp';
  };

  self.show = function(kind, title, msg) {
    return toastr[ kind ](msg, title).css("width", "500px");
  };

  self.init(window.toastr);

};


//


var onDocumentReady = function() {
  // var uri = 'http://localhost:8080';
  var uri = ''; // same host we accessed using http
  var opts = {};

  var link = new Link(uri, opts);
  var toaster = new Toaster();
  // var socketIO = io(uri, {});
//    var socketIO = io.connect( uri, opts ); // Connection via web-sockets


  var setInitControls = function() {
    $('#editQueue').val('support');
    $('#editPhone').val('201');
  };
  setInitControls();

  var onConnect = function() {
    var queue = $('#editQueue').val();
    var phone = $('#editPhone').val();
    link.subscribe(queue, phone, function(err) {
      if (err) { return; }
      // no action to be taken so far
    });
  };

  link.on('message', function(data) {
    console.log('on(message): data:', data);
  });

  link.on('test', function(data) {
    console.log('on(test): data:', data);
  });

  link.on('ami:extensionstatus', function(data) {
    console.log('on(ami:extensionstatus): data:' + JSON.stringify(data));
    setExtensionState(data.raw.statustext);
  });

  link.on('ami:devicestatechange', function(data) {
    console.log('on(ami:devicestatechange): data:' + JSON.stringify(data));
    setDeviceState(data.raw.state);
  });

  link.on('ami:queuemember', function(data) {
    console.log('on(ami:queuemember): data:' + JSON.stringify(data));
    // setDeviceState(data.raw.state);
  });


  var QUEUE_MEMBER_STATUSES = [
    'AST_DEVICE_UNKNOWN',
    'AST_DEVICE_NOT_INUSE',
    'AST_DEVICE_INUSE',
    'AST_DEVICE_BUSY',
    'AST_DEVICE_INVALID',
    'AST_DEVICE_UNAVAILABLE',
    'AST_DEVICE_RINGING',
    'AST_DEVICE_RINGINUSE',
    'AST_DEVICE_ONHOLD',
  ];

  link.on('ami:queuememberstatus', function(data) {
    // {
    //   "event":          "QueueMemberStatus",
    //   "privilege":      "agent,all",
    //   "status":         "1",
    //   "queue":          "support",
    //   "callstaken":     "2",
    //   "membername":     "Agent/xxx",
    //   "penalty":        "0",
    //   "stateinterface": "SIP/201",
    //   "interface":      "SIP/201",
    //   "lastcall":       "1467411374",
    //   "membership":     "dynamic",
    //   "paused":         "0",
    //   "ringinuse":      "0"
    // }
    var statusCode = data.raw.status;
    var statusText = QUEUE_MEMBER_STATUSES[statusCode] || QUEUE_MEMBER_STATUSES[0];
    console.log('on(ami:queuememberstatus): statusText: '+statusText+', paused: '+data.raw.paused+', data:' + JSON.stringify(data));
    // setDeviceState(data.raw.state);
  });

  link.on('ami:agentcalled', function(data) {
    // {
    //   "event":                 "AgentCalled",
    //   "privilege":             "agent,all",
    //   "channel":               "SIP/200-000000d5",
    //   "channelstate":          "4",
    //   "channelstatedesc":      "Ring",
    //   "calleridnum":           "200",
    //   "calleridname":          "<unknown>",
    //   "connectedlinenum":      "<unknown>",
    //   "connectedlinename":     "<unknown>",
    //   "accountcode":           "",
    //   "context":               "from_internal",
    //   "exten":                 "999",
    //   "priority":              "1",
    //   "uniqueid":              "1467411363.388",
    //   "destchannel":           "SIP/201-000000d6",
    //   "destchannelstate":      "0",
    //   "destchannelstatedesc":  "Down",
    //   "destcalleridnum":       "<unknown>",
    //   "destcalleridname":      "<unknown>",
    //   "destconnectedlinenum":  "200",
    //   "destconnectedlinename": "<unknown>",
    //   "destaccountcode":       "",
    //   "destcontext":           "from_internal",
    //   "destexten":             "999",
    //   "destpriority":          "1",
    //   "destuniqueid":          "1467411363.389",
    //   "queue":                 "support",
    //   "interface":             "SIP/201",
    //   "membername":            "Agent/xxx"
    // }
    console.log('on(ami:agentcalled): data:' + JSON.stringify(data));
    toaster.show(
      'warning',
      'New incoming call',
      'New call from \''+data.raw.calleridnum+'\' for \''+data.raw.queue+'\' queue',
      { timeout: 0 }
    );
  });

  link.on('ami:agentconnect', function(data) {
    // {
    //   "event":                 "AgentCalled",
    //   "privilege":             "agent,all",
    //   "channel":               "SIP/200-000000d5",
    //   "channelstate":          "4",
    //   "channelstatedesc":      "Ring",
    //   "calleridnum":           "200",
    //   "calleridname":          "<unknown>",
    //   "connectedlinenum":      "<unknown>",
    //   "connectedlinename":     "<unknown>",
    //   "accountcode":           "",
    //   "context":               "from_internal",
    //   "exten":                 "999",
    //   "priority":              "1",
    //   "uniqueid":              "1467411363.388",
    //   "destchannel":           "SIP/201-000000d6",
    //   "destchannelstate":      "0",
    //   "destchannelstatedesc":  "Down",
    //   "destcalleridnum":       "<unknown>",
    //   "destcalleridname":      "<unknown>",
    //   "destconnectedlinenum":  "200",
    //   "destconnectedlinename": "<unknown>",
    //   "destaccountcode":       "",
    //   "destcontext":           "from_internal",
    //   "destexten":             "999",
    //   "destpriority":          "1",
    //   "destuniqueid":          "1467411363.389",
    //   "queue":                 "support",
    //   "interface":             "SIP/201",
    //   "membername":            "Agent/xxx"
    // }
    console.log('on(ami:agentconnect): data:' + JSON.stringify(data));
    toaster.show(
      'success',
      'Answered',
      'Call from \''+data.raw.calleridnum+'\' for \''+data.raw.queue+'\' queue has been answered',
      { timeout: 0 }
    );
  });

  link.on('ami:agentcomplete', function(data) {
    // {
    //   "event":                 "AgentCalled",
    //   "privilege":             "agent,all",
    //   "channel":               "SIP/200-000000d5",
    //   "channelstate":          "4",
    //   "channelstatedesc":      "Ring",
    //   "calleridnum":           "200",
    //   "calleridname":          "<unknown>",
    //   "connectedlinenum":      "<unknown>",
    //   "connectedlinename":     "<unknown>",
    //   "accountcode":           "",
    //   "context":               "from_internal",
    //   "exten":                 "999",
    //   "priority":              "1",
    //   "uniqueid":              "1467411363.388",
    //   "destchannel":           "SIP/201-000000d6",
    //   "destchannelstate":      "0",
    //   "destchannelstatedesc":  "Down",
    //   "destcalleridnum":       "<unknown>",
    //   "destcalleridname":      "<unknown>",
    //   "destconnectedlinenum":  "200",
    //   "destconnectedlinename": "<unknown>",
    //   "destaccountcode":       "",
    //   "destcontext":           "from_internal",
    //   "destexten":             "999",
    //   "destpriority":          "1",
    //   "destuniqueid":          "1467411363.389",
    //   "queue":                 "support",
    //   "interface":             "SIP/201",
    //   "membername":            "Agent/xxx"
    // }
    console.log('on(ami:agentcomplete): data:' + JSON.stringify(data));
    toaster.show(
      'success',
      'Answered',
      'Call from \''+data.raw.calleridnum+'\' for \''+data.raw.queue+'\' queue has been answered',
      { timeout: 0 }
    );
  });

  link.on('ami:agentringnoanswer', function(data) {
    //   {
    //     "event":             "AgentRingNoAnswer",
    //     "privilege":             "agent,all",
    //     "channel":               "SIP/200-00000041",
    //     "channelstate":          "4",
    //     "channelstatedesc":      "Ring",
    //     "calleridnum":           "200",
    //     "calleridname":          "<unknown>",
    //     "connectedlinenum":      "<unknown>",
    //     "connectedlinename":     "<unknown>",
    //     "accountcode":           "",
    //     "context":               "from_internal",
    //     "exten":                 "999",
    //     "priority":              "1",
    //     "uniqueid":              "1467407856.94",
    //     "destchannel":           "SIP/201-0000009b",
    //     "destchannelstate":      "5",
    //     "destchannelstatedesc":  "Ringing",
    //     "destcalleridnum":       "<unknown>",
    //     "destcalleridname":      "<unknown>",
    //     "destconnectedlinenum":  "200",
    //     "destconnectedlinename": "<unknown>",
    //     "destaccountcode":       "",
    //     "destcontext":           "from_internal",
    //     "destexten":             "999",
    //     "destpriority":          "1",
    //     "destuniqueid":          "1467409636.184",
    //     "queue":                 "support",
    //     "ringtime":              "15000",
    //     "interface":             "SIP/201",
    //     "membername":            "Agent/xxx"
    //   }
    // }
    console.log('on(ami:agentringnoanswer): data:' + JSON.stringify(data));
    toaster.show(
      'error',
      'agentringnoanswer',
      'You missed call from \''+data.raw.calleridnum+'\' for \''+data.raw.queue+'\' queue',
      { timeout: 0 }
    );
  });

  // socketIO.on('connect', function() {
  link.on('connect', function() {
    onConnect();
  });


  /**
   * For $el remove all Bootstrap state classes (like btn-default, btn-primary,... for buttons,
   * label-default,... for labels etc) and add class corresponding to typ and cls values
   * (typ is element type, i.e.  btn or label, cls is
   *
   * @param $el             jQuery element
   * @param {string} typ    element type: btn || label
   * @param {string} cls    status name: default || primary || success || info || warning || danger
   */
  function setClass($el, typ, cls) {
    $el.removeClass(
      typ+'-default '+
      typ+'-primary '+
      typ+'-success '+
      typ+'-info '+
      typ+'-warning ' +
      typ+'-danger'
    );
    $el.addClass(typ + '-'+cls);
  }

  var EXTENSION_STATE_CLASSES = {
    'idle':          'success',
    'inuse':         'primary',
    'busy':          'primary',
    'unavailable':   'default',
    'ringing':       'warning',
    'inuse&ringing': 'warning',
    'hold':          'info',
    'inuse&hold':    'info',
    'unknown':       'danger'
  };

  function setExtensionState(statusText) {
    var $el = $('#spanExtensionState');
    $el.text(statusText);
    var cls = EXTENSION_STATE_CLASSES[statusText.toLowerCase()] || 'default';
    setClass($el, 'label', cls);
  }

  var DEVICE_STATE_CLASSES = {
    'INUSE':         'primary',
    'BUSY':          'primary',
    'UNAVAILABLE':   'default',
    'RINGING':       'warning',
    'RINGINUSE':     'warning',
    'ONHOLD':        'info',
    'INVALID':       'danger',
    'NOT_INUSE':     'success',
    'UNKNOWN':       'danger'
  };

  function setDeviceState(statusText) {
    var $el = $('#spanDeviceState');
    $el.text(statusText);
    var cls = DEVICE_STATE_CLASSES[statusText.toUpperCase()] || 'default';
    setClass($el, 'label', cls);
  }

  //

  $('#btnSubscribe').click( function(event) {
    // console.log('#btnSubscribe click: event: ', event);
    var queue = $('#editQueue').val();
    var phone = $('#editPhone').val();
    link.subscribe(queue, phone, function(err) {
      if (err) { return; }
      // no action to be taken so far
    });
  });

  $('#btnActionExtensionState').click( function(event) {
    var phone = $('#editPhone').val();
    link.doActionExtensionState(phone, function(err, statusCode, statusText) {
      if (err) { return; }
      setExtensionState(statusText);
    });
  });

  $('.wrtc-actions').click( function(event) {
    // console.log('.wrtc-actions click: event: ', event);
    var queue = $('#editQueue').val();
    var phone = $('#editPhone').val();

    var $btnQueuePause = $('#btnQueuePause');
    var paused = $btnQueuePause.hasClass('btn-warning');

    var action = event.target.dataset.action;
    link.action(action, {
      queue:  queue,
      phone:  phone,
      device: 'SIP/'+phone,
      paused: paused
    }, function(err, res) {
      if (err) {
        toaster.show('error', action, JSON.stringify(err));
        return;
      }
      toaster.show('info', action, JSON.stringify(res)).css("font-size", "10px");

      if (action === 'queuepause') {
        // $btnQueuePause.removeClass('btn-default btn-primary btn-success btn-info btn-warning btn-danger');
        var cls = paused ? 'success' : 'warning';
        var txt = paused ? 'unpause' : 'pause';
        $btnQueuePause.text(txt);
        // var cls = EXTENSION_STATE_CLASSES[ statustext.toLowerCase() ] || 'default';
        // $btnQueuePause.addClass('btn-' + cls);
        setClass($btnQueuePause, 'btn', cls);
      }

      if (action === 'extensionstate') {
      }

      if (action === 'corestatus') {
        toaster.show('success', 'CoreStatus',
          '<div>corecurrentcalls:'     + res.corecurrentcalls + '</div>' +
          '<div>corereloaddate/time:'  + res.corereloaddate   + ' ' + res.corereloadtime + '</div>' +
          '<div>corestartupdate/time:' + res.corestartupdate  + ' ' + res.corestartuptime +'</div>'
        );
      }

    });
  });

};

$(document).ready(onDocumentReady);


