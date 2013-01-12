/* Copyright (c) 2011 Ricebridge */

var common  = require('../common');

var eyes    = common.eyes
var util    = common.util
var assert  = common.assert
var _       = common._
var uuid    = common.uuid
var connect = common.connect






function EditPlugin() {
  var self = this;
  self.name = 'edit';


  self.init = function(seneca,opts,cb){

    self.options = (seneca.options.plugin && seneca.options.plugin[self.name]) || {
      
    }

    seneca.add({on:self.name,cmd:'quickcode'},function(args,seneca,cb){
      
    })

    cb()
  }


  self.web = {}



  // can create more than one service for different tenants
  self.service = function(opts,cb) {
    if( !cb ) {
      throw new Error('callback missing (must be last argument)')
    }

    console.dir(opts)

    var prefix     = opts.prefix || '/edit'
    var restprefix = opts.restprefix || '/rest'

    var tenant  = opts.tenant
    var ents    = opts.ents || []

    var entre    = new RegExp(prefix+'/ent/([^\/]*)/([^\/]*)$')
    var staticre = new RegExp(prefix+'/.*(static/.*)$')

    if( !tenant ) {
      return cb('plugin_edit_notenant')
    }


    var folder = self.options.folder || __dirname+'/'+self.name+'/web'
    var static = connect.static(folder)

    var router = connect.router(function(app){
      app.get(prefix+'/api/ents', function(req,res) {
        common.sendjson(res,{ents:ents})
      }),
      app.get(prefix+'/api/opts', function(req,res) {
        common.sendjson(res,{restprefix:restprefix})
      })
    })

    return function( req, res, next ) {
      var m = null

      console.log('edit',req.url)

      if( prefix+'/main' == req.url ) {
        req.url = '/main.html'
        static(req,res,next)
      }
      else if( m = entre.exec(req.url) ) {
        req.url = '/ent.html'
        static(req,res,next)
      }
      else if( m = staticre.exec(req.url) ) {
        req.url = m[1]
        static(req,res,next)
      }
      else {
        router( req, res, next )
      }
    }

  }

}


exports.plugin = function() {
  return new EditPlugin()
}

