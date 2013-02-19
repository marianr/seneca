/* Copyright (c) 2010-2013 Richard Rodger */

"use strict";

var common   = require('../lib/common')
var seneca   = require('../lib/seneca')


var eyes    = common.eyes
var assert  = require('chai').assert
var gex     = common.gex


var logger = require('./logassert')


describe('seneca', function(){

  it('quick', function(){
    var si = seneca()
    si.use(function quickplugin(si,opts,cb){
      si.add({a:1},function(args,cb){cb(null,{b:2})})
      cb()
    })
    si.act({a:1},function(err,out){
      assert.equal(out.b,2)
    })
  })


  it('failgen.afterinit', function() {
    try {
      var i = 0
      seneca({},function(err,si){
        assert.equal( 0, i )
        throw new Error('after init '+(i++))
      })
      assert.fail()
    }
    catch(e) {
      //eyes.inspect(e)
      assert.equal('Seneca: after init 0',e.seneca.error.message)
      assert.equal('seneca/callback_exception',e.seneca.code)
    }
  })


  it('failgen.afterinit.plugins', function() {
    try {
      var i = 0
      seneca({plugins:['error-test']},function(err,si){
        assert.equal( 0, i )
        throw new Error('plugins after init '+(i++))
      })
      assert.fail()
    }
    catch(e) {
      //console.log(e)
      assert.equal('seneca/callback_exception',e.seneca.code)
      assert.equal('Seneca: plugins after init 0',e.seneca.error.message)
    }
  })



  it('failgen.meta', function() {
    seneca({},function(err,si){
      assert.isNull(err)
      
      // nothing
      var err = si.fail()
      //eyes.inspect(err)
      assert.equal(err.seneca.code,'unknown')
      assert.equal(err.message,'Seneca: unknown error.')


      // unresolved code gets used as message
      err = si.fail('code1')
      //eyes.inspect(err)
      assert.equal(err.seneca.code,'code1')
      assert.equal(err.message,'Seneca: code1 "code1"')

      // no code
      err = si.fail({bar:1})
      //eyes.inspect(err)
      assert.equal(err.seneca.code,'unknown')
      assert.equal(err.seneca.bar,1)
      assert.equal(err.message,'Seneca: unknown error.')

      // additional meta props dragged along
      err = si.fail({code:'code2',bar:2})
      //eyes.inspect(err)
      assert.equal(err.seneca.code,'code2')
      assert.equal(err.seneca.bar,2)
      assert.equal(err.message,'Seneca: code2 {"code":"code2","bar":2}')
    })
  })


  it('failgen.callbacks', function() {
    seneca({},function(err,si){
      assert.isNull(err)
      
      var cblog = ''

      si.fail(function(err){
        assert.equal(err.seneca.code,'unknown')
        assert.equal(err.message,'Seneca: unknown error.')
        cblog+='a'
      })

      si.fail('msg1',function(err){
        assert.equal(err.seneca.code,'msg1')
        assert.equal(err.message,'Seneca: msg1 "msg1"')
        cblog+='b'
      })

      si.fail('code1',function(err){
        assert.equal(err.seneca.code,'code1')
        assert.equal(err.message,'Seneca: code1 "code1"')
        cblog+='c'
      })

      si.fail({code:'code2',bar:1},function(err){
        assert.equal(err.seneca.code,'code2')
        assert.equal(err.seneca.bar,1)
        assert.equal(err.message,'Seneca: code2 {"code":"code2","bar":1}')
        cblog+='d'
      })

      si.fail(function(err,a1,a2){
        assert.equal(err.seneca.code,'unknown')
        assert.equal(err.message,'Seneca: unknown error.')
        assert.equal('arg1',a1)
        assert.equal('arg2',a2)
        cblog+='e'
      },'arg1','arg2')

      si.fail('m1',function(err,a1,a2){
        assert.equal(err.seneca.code,'m1')
        assert.equal(err.message,'Seneca: m1 "m1"')
        assert.equal('arg1',a1)
        assert.equal('arg2',a2)
        cblog+='f'
      },'arg1','arg2')

      assert.equal('abcdef',cblog)
    })
  })


  it('failgen.badplugin', function() {
    seneca({},function(err,si){
      assert.isNull(err)

      try { si.service('not-a-plugin') } catch( e ) { 
        assert.equal('seneca/service_unknown_plugin',e.seneca.code)
        assert.equal('not-a-plugin',e.seneca.pluginname)
        assert.equal('Seneca: service(pluginname): unable to build service, unknown plugin name: not-a-plugin',e.message)
      }

      try { si.findplugin('not-a-plugin') } catch( e ) { 
        assert.equal('seneca/plugin_unknown_plugin',e.seneca.code)
        assert.equal('not-a-plugin',e.seneca.pluginname)
        assert.equal('Seneca: service(pluginname): unknown plugin name: not-a-plugin',e.message)
      }

      try { 
        si.act({on:'not-a-plugin',cmd:'not-a-cmd'},function(err){
          //eyes.inspect(err)
          //console.log(err)
          assert.isNotNull(err)
        }) 
      } catch( e ) { console.log(e); assert.fail();}

    })
  })


  it('failgen.cmd', function() {
    try {

      var i = 0;
      seneca({plugins:['echo','error-test']},function(err,si){
        assert.isNull(err)
        assert.equal(0,i)

        si.act({role:'error-test'},function(err){
          assert.isNull(err)
        })

        try {
          si.act({role:'error-test'},function(err){
            throw new Error('inside callback')
          })
          assert.fail()
        }
        catch(e) {
          assert.equal(e.seneca.code,'seneca/act_error')
        }


        throw new Error('inside callback 3')
      })
    }
    catch(e) {
      //eyes.inspect(e)
      assert.equal('seneca/callback_exception',e.seneca.code)
      assert.equal('Seneca: inside callback 3',e.seneca.error.message)
    }


    seneca({plugins:['echo','error-test']},function(err,si){
      var cblog = ''

      si.act({role:'error-test',how:'fail'},function(err){
        //console.log('HOW-fail')
        //eyes.inspect(err)
        assert.equal('error_code1',err.seneca.code)
        cblog += 'a'
      })

      si.act({role:'error-test',how:'msg'},function(err){
        //console.log('HOW-msg')
        //eyes.inspect(err)
        assert.equal('an error message',err.seneca.code)
        assert.equal('Seneca: an error message "an error message"',err.message)
        cblog += 'b'
      })

      si.act({role:'error-test',how:'errobj'},function(err){
        //console.log('HOW-errobj')
        //eyes.inspect(err)
        assert.equal('unknown',err.seneca.code)
        assert.equal('Seneca: an Error object',err.message)
        cblog += 'c'
      })


      si.act({role:'error-test',how:'str'},function(err){
        //console.log('HOW-str')
        //eyes.inspect(err)
        assert.equal('a string error',err.seneca.code)
        assert.equal('Seneca: a string error "a string error"',err.message)
        cblog += 'd'
      })


      si.act({role:'error-test',how:'obj'},function(err){
        //console.log('HOW-obj')
        //eyes.inspect(err)
        assert.equal('unknown',err.seneca.code)
        assert.equal('an object',err.seneca.error)
        assert.equal('Seneca: unknown error.',err.message)
        cblog += 'e'
      })

      assert.equal('abcde',cblog)
    })
  })



  it('register', function() {
    seneca({},function(err,si){
      var initfn = function(){}
      var emptycb = function(){}

      try { si.register() } catch( e ) { 
        //console.log(e)
        assert.equal('seneca/register_invalid_plugin',e.seneca.code)
      }


      try { si.register({}) } catch( e ) { 
        //console.log(e)
        assert.equal('seneca/register_invalid_plugin',e.seneca.code)
        assert.equal("Seneca: register(plugin): The property 'name' is missing and is always required (parent: plugin).",e.message)
      }

      try { si.register({},emptycb) } catch( e ) { 
        //console.log(e)
        assert.equal('seneca/register_invalid_plugin',e.seneca.code)
        assert.equal("Seneca: register(plugin): The property 'name' is missing and is always required (parent: plugin).",e.message)
      }

      try { si.register({name:1,init:initfn},emptycb) } catch( e ) { 
        assert.equal('seneca/register_invalid_plugin',e.seneca.code)
      }

      try { si.register({name:'a',init:'b'},emptycb) } catch( e ) { 
        //console.log(e)
        assert.equal('seneca/register_invalid_plugin',e.seneca.code)
      }

    })
  })



  it('action', function() {
    seneca(
      {},
      function(err,seneca){
        assert.isNull(err)
        var a1  = 0;

        seneca.add({op:'foo'},function(args,cb) {
          a1 = args.a1
          cb(null,'+'+a1)
        });

        seneca.act({op:'foo',a1:100}, function(err,out) {
          assert.isNull(err)
          assert.equal('+100',out)
          assert.equal(100,a1)
      
          seneca.act({op:'foo',a1:200}, function(err,out) {
            assert.isNull(err)
            assert.equal('+200',out)
            assert.equal(200,a1)
          })
        })
      }
    )
  })



  it('plugins', function() {

    seneca({plugins:['echo']},function(err,seneca){
      assert.isNull(err)

      seneca.act({role:'echo',baz:'bax'},function(err,out){
        assert.isNull(err)
        assert.equal(''+{baz:'bax'},''+out)
      })
    })


    seneca({plugins:['util']},function(err,seneca){
      assert.isNull(err)

      seneca.act({role:'util',cmd:'quickcode'},function(err,code){
        assert.isNull(err)
        assert.equal( 8, code.length )
        assert.isNull( /[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/.exec(code) )
      })
    })


    function Mock1() {
      var self = this
      self.name = 'mock1'
      self.plugin = function() {
        return self
      }
      self.init = function(seneca,opts,cb){
        seneca.add({role:self.name,cmd:'foo'},function(args,cb){
          cb(null,'foo:'+args.foo)
        })
        cb()
      }
    }


    seneca( 
      {},
      function(err,si){
        assert.isNull(err)

        si.register(new Mock1(), function(err){
          assert.isNull(err)

          si.act({role:'mock1',cmd:'foo',foo:1},function(err,out){
            assert.equal('foo:1',out)
          })
        })
      }
    )



    seneca(
      {},
      function(err,si){
        assert.isNull(err)

        var mock1a = new Mock1()
        mock1a.name = 'mock1a'
        si.register(mock1a, function(err){
          assert.isNull(err)

          si.act({role:'mock1a',cmd:'foo',foo:1},function(err,out){
            assert.equal('foo:1',out)
          })
        })
      }
    )



    function Mock2() {
      var self = this
      self.name = 'mock2'
      self.plugin = function() {
        return self
      }
      self.init = function(si,opts,cb){
        si.add({role:'mock1',cmd:'foo'},function(args,cb){
          args.parent$(args,function(err,out){
            cb(null,'bar:'+out)
          })
        })
        cb()
      }
    }


    seneca(
      {},
      function(err,si){
        assert.isNull(err)

        si.register( new Mock1(), function(err){
          assert.isNull(err)

          si.register( new Mock2(), function(err){
            assert.isNull(err)

            si.act({role:'mock1',cmd:'foo',foo:2},function(err,out){
              assert.equal('bar:foo:2',out)
            })
          })
        })
      }
    )


    seneca(
      {plugins:['echo']},
      function(err,si){
        assert.isNull(err)

        si.act({role:'echo',cmd:'foo',bar:1},function(err,out){
          assert.equal( JSON.stringify({cmd:'foo',bar:1}), JSON.stringify(out) )
        })
      }
    )

  })


  it('pin', function() {
    seneca(
      {},//{log:'print'},
      function(err,si){
        assert.isNull(err)

        var log = []

        si.add({p1:'v1',p2:'v2a'},function(args,cb){
          //console.log('a'+args.p3)
          log.push('a'+args.p3)
          cb(null,{p3:args.p3})
        })

        si.add({p1:'v1',p2:'v2b'},function(args,cb){
          //console.log('b'+args.p3)
          log.push('b'+args.p3)
          cb(null,{p3:args.p3})
        })

        var api = si.pin({p1:'v1',p2:'*'})
        //eyes.inspect(api)

        api.v2a({p3:'A'},function(e,r){assert.equal(r.p3,'A')})
        api.v2b({p3:'B'},function(e,r){assert.equal(r.p3,'B')})
      }
    )
  })


  it('compose', function() {
    var si = seneca({log:'print'})   

    si.add({A:1},function(args,cb){
      cb(null,{x:2})
    })
    si.add({B:1},function(args,cb){
      cb(null,{x:args.x+1})
    })
    si.add({C:1},function(args,cb){
      cb(null,{y:args.y+1})
    })

    si.act({A:1},function(e,r){assert.equal(r.x,2)})
    si.act({B:1,x:1},function(e,r){assert.equal(r.x,2)})

    si.compose({D:1},[{A:1},{B:1}])
    si.act({D:1},function(e,r){assert.equal(r.x,3)})

    si.compose({E:1},[{A:1,modify$:function(res){res.y=res.x}},{C:1}])
    si.act({E:1},function(e,r){assert.equal(r.y,3)})


    si.add({F:1},function(args,cb){
      cb(null,{y:args.y+args.z})
    })
    si.compose({G:1},[{A:1,modify$:function(res,args){res.y=res.x,res.z=args.z}},{F:1}])
    si.act({G:1,z:3},function(e,r){assert.equal(r.y,5)})
  })

})