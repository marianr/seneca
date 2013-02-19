
var logentries = require('node-logentries')

var log = logentries.logger({
  token:'YOUR_TOKEN',

  // redefine log levels to match the ones seneca uses
  levels:{debug:0,info:1,warn:2,error:3,fatal:4}
})

var seneca = require('../..')({
  log:{
    map:[
      {level:'all',handler:function(){
        log.log(arguments[1],Array.prototype.join.call(arguments,'\t'))
      }}
    ]
  }
})

seneca.use( 'sales-tax-plugin', {country:'IE',rate:0.23} )
seneca.use( 'sales-tax-plugin', {country:'UK',rate:0.20} )

seneca.act( {cmd:'salestax', country:'IE', net:100})
seneca.act( {cmd:'salestax', country:'UK', net:200})
seneca.act( {cmd:'salestax', country:'UK', net:300})


