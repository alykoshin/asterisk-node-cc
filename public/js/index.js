/**
 * Created by alykoshin on 28.06.16.
 */

$(document).ready(function() {
  var uri = 'http://localhost:8080';
  var opts = {};

  console.log('connecting...');
  var socketIO = io(uri, {});
//    var socketIO = io.connect( uri, opts ); // Connection via web-sockets

  socketIO.on('message', function(data) {
    console.log('on(message): data:', data);
  });

  socketIO.on('test', function(data) {
    console.log('on(test): data:', data);
  });

  socketIO.on('ami:extensionstatus', function(data) {
    console.log('on(ami:extensionstatus): data:', data);

    var phone = $('#editPhone').val();
    if (data.raw.exten !== phone)  { return; }

    setExtensionState(data.raw.statustext);
  });

  socketIO.on('ami:devicestatechange', function(data) {
    console.log('on(ami:devicestatechange): data:', data);
    // setExtensionState(data.raw.statustext);
  });

  socketIO.on('connect',           function()        { console.log('on(connect)'); });
  socketIO.on('error',             function(error)   { console.log('on(error):', error); });
  socketIO.on('disconnect',        function()        { console.log('on(disconnect)'); });
  socketIO.on('reconnect',         function(attempt) { console.log('on(reconnect):', attempt); });
  socketIO.on('reconnect_attempt', function()        { console.log('on(reconnect_attempt)'); });
  socketIO.on('reconnecting',      function(attempt) { console.log('on(reconnecting):', attempt); });
  socketIO.on('reconnect_error',   function(error)   { console.log('on(reconnect_error):', error); });
  socketIO.on('reconnect_failed',  function()        { console.log('on(reconnect_failed)'); });


  var EXTENSION_STATUS_CLASSES = {
    'idle':          'success',
    'inuse':         'primary',
    'busy':          'primary',
    'unavailable':   'default',
    'ringing':       'danger',
    'inuse&Ringing': 'danger',
    'hold':          'warning',
    'inuse&hold':    'warning',
    'unknown':       'default'
  };

  function setExtensionState(statustext) {
    var spanStatus = $('#spanStatus');
    spanStatus.text(statustext);
    var cls = EXTENSION_STATUS_CLASSES[statustext.toLowerCase()] || 'default';
    spanStatus.removeClass('label-default label-primary label-success label-info label-warning label-danger');
    spanStatus.addClass('label-'+cls);
  }

  $('#btnSubscribe').click( function(event) {
    // console.log('#btnSubscribe click: event: ', event);
    var queue = $('#editQueue').val();
    var phone = $('#editPhone').val();
    // socketIO.emit('message', { data: 'data_emit' });
    var data = [ {
      event:  'devicestatechange',
      device: 'SIP/' + phone
    } ];
    socketIO.send({ name: 'test:subscribe', data: data }, function(err, res) {
      console.log('err:', err, ', res:', res);
      setExtensionState(res.statustext);
    });
  });

  $('#btnActionExtensionState').click( function(event) {
    // console.log('#btnExtensionState click: event: ', event);
    var queue = $('#editQueue').val();
    var phone = $('#editPhone').val();
    // socketIO.emit('message', { data: 'data_emit' });
    socketIO.send({ name: 'test:extensionstate', queue: queue, phone: phone }, function(err, res) {
      console.log('err:', err, ', res:', res);
      setExtensionState(res.statustext);
    });
  });

  $('.wrtc-actions').click( function(event) {
    console.log('.wrtc-actions click: event: ', event);
    var queue = $('#editQueue').val();
    var phone = $('#editPhone').val();

    var btnQueuePause = $('#btnQueuePause');
    var paused = btnQueuePause.hasClass('btn-warning');
    // socketIO.emit('message', { data: 'data_emit' });
    var action = event.target.dataset.action;
    socketIO.send({
      name: 'test:'+action,
      queue: queue,
      phone: 'SIP/'+phone,//'Agent/007',//'SIP/'+phone,
      paused: paused
    }, function(err, res) {
      console.log('err:', err, ', res:', res);
      // setExtensionState(res.statustext);
      if (err) { console.error(err); return; }

      if (action === 'queuepause') {
        btnQueuePause.removeClass('btn-default btn-primary btn-success btn-info btn-warning btn-danger');
        var cls = paused ? 'success' : 'warning';
        var txt = paused ? 'unpause' : 'pause';
        btnQueuePause.text(txt);
        // var cls = EXTENSION_STATUS_CLASSES[ statustext.toLowerCase() ] || 'default';
        btnQueuePause.addClass('btn-' + cls);
      }

    });
  });

});

