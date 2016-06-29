/**
 * Created by alykoshin on 28.06.16.
 */

'use strict';

const EventEmitter = require('events');

//

class Dispatcher extends EventEmitter {}

Dispatcher.prototype._emit = Dispatcher.prototype.emit;

Dispatcher.prototype.emit = function() {
  var args = Array.prototype.slice.call(arguments);
  console.log('Dispatcher: emit(): ', args);
  Dispatcher.prototype._emit.apply(this, arguments);
};

Dispatcher.prototype._on = Dispatcher.prototype.on;

Dispatcher.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments);
  console.log('Dispatcher: on(): ', args);
  if (typeof arguments[0] === 'string') {
    Dispatcher.prototype._on.apply(this, arguments);
  } else { // array of filtered events
    arguments[0].forEach(function(arg) {
      
    });

  }
};

//

const dispatcher = new Dispatcher();

//

module.exports = dispatcher;
