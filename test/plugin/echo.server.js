/* Copyright (c) 2010-2013 Ricebridge */

"use strict";


var connect = require('connect')
var seneca  = require('../..')

var si = seneca()
si.use('echo')

var app = connect()
  .use(connect.logger())
  .use(connect.json())
  .use( si.service() )
  .listen(3000)


// curl -H "Content-Type:application/json" -d '{"a":1}' http://localhost:3000/echo
