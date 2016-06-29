/**
 * port:  port server
 * host: host server
 * username: username for authentication
 * password: username's password for authentication
 * events: this parameter determines whether events are emited.
 **/
'use strict';

var ami = require('./lib/ami');
// var app  = require('./lib/express');
var server  = require('./lib/server')({ HTTP_PORT: 8080, });
var ws  = require('./lib/ws')(server);
