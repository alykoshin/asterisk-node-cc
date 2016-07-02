/**
 * Created by alykoshin on 28.06.16.
 */

'use strict';

const EventEmitter = require('events');
const chalk = require('chalk');
const debug = require('debug')('dispatcher');
const _ = require('lodash');

//

class Dispatcher extends EventEmitter {}

//

Dispatcher.prototype._emit = Dispatcher.prototype.emit;

Dispatcher.prototype.emit = function() {
  var args = Array.prototype.slice.call(arguments);
  debug(chalk.magenta('Dispatcher: emit(): ' + JSON.stringify(args)));
  Dispatcher.prototype._emit.apply(this, arguments);
};

//

Dispatcher.prototype._on = Dispatcher.prototype.on;

Dispatcher.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments);
  debug(chalk.magenta('Dispatcher: on(): ' + JSON.stringify(args)));
  Dispatcher.prototype._on.apply(this, arguments);
};

//

Dispatcher.prototype.subscribe = function(source, filter, callback) {
  filter = Array.isArray(filter) ? filter : [filter];
  debug(chalk.magenta('Dispatcher.subscribe(): source:'+ source+ ', filter: '+JSON.stringify(filter)));
  this.on(source, function(event) {
    debug(chalk.magenta('Dispatcher.subscribe(): this.on(): source:'+ source+ ', filter: '+JSON.stringify(filter)));
    filter.forEach(function(singleFilter) {
      if (_.matches(singleFilter)(event)) {
        // this.publish(source, event, callback);
        debug(chalk.magenta('Dispatcher.subscribe(): this.on(): matches: source:'+ source+ ', filter: '+JSON.stringify(filter)));
        callback(source, event);
      }
    });
  });
};


Dispatcher.prototype.publish = function(source, event, callback) {
  debug(chalk.magenta('Dispatcher.publish(): source:'+ source+ ', event: '+JSON.stringify(event)));
  this.emit(source, event, callback);
};

//

const dispatcher = new Dispatcher();

//

module.exports = dispatcher;
