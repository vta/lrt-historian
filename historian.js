'use strict'

const unirest = require('unirest')
const pg = require('pg')
const config = require('./config')
const logger = require('./log')
var parse = require('xml-parser');

var recentUpdated = {}

function getTransloc () {
  var Request = unirest.get('https://transloc-api-1-2.p.mashape.com/vehicles.json?agencies=' + config.AGENCY_ID + '&callback=call')

  if (config.HTTP_PROXY) {
    Request.proxy(config.HTTP_PROXY)
  }

  Request.header('X-Mashape-Key', config.TRANSLOC_API_KEY)
    .header('Accept', 'application/json')
    .end(function (result) {
      if (result.error) {
        logger.error(result.error)
        return
      }
      // logger.info(result.connection, result.status, result.headers, JSON.stringify(result.body), JSON.stringify(result))

      var vehiclesData = result.body['data'][config.AGENCY_ID]

      if (!vehiclesData) {
        logger.error(JSON.stringify(result.body))
        return
      }

      var thisUpdateData = []
      var newDataCount = 0
      var oldDataCount = 0
      for (var i = 0; i < vehiclesData.length; i++) {
        var vehicleName = vehiclesData[i]['call_name']
        var currentUpdated = new Date(vehiclesData[i]['last_updated_on'])
        if (!(vehicleName in recentUpdated) || currentUpdated.getTime() > recentUpdated[vehicleName].getTime()) {
          logger.info('updating data for vehicle ' + vehicleName + ' at ' + currentUpdated)
          newDataCount = newDataCount + 1
          recentUpdated[vehicleName] = currentUpdated
          thisUpdateData.push(vehiclesData[i])
        } else {
          logger.info('got old data for vehicle ' + vehicleName + '; last updated at ' + recentUpdated[vehicleName])
          oldDataCount = oldDataCount + 1
        }
      }
      logger.info('got new new data for ' + newDataCount + ' vehicle' + (newDataCount > 1 ? 's' : '') + ' and old data for ' + oldDataCount + ' vehicle' + (oldDataCount > 1 ? 's' : ''))
      writeUpdatesToDB(thisUpdateData)
    })
}
//This Function should pull data from the moovmanage api
function getMoovManage () {
  var Request = unirest.get('https://www.moovmanage.com/public_api/devices?api_key=' + config.BUS_API_KEY)

  if (config.HTTP_PROXY) {
    Request.proxy(config.HTTP_PROXY)
  }


  Request.header('Accept', 'application/xml')
  .header('Content-Type', 'application/xml')
    .end(function (result) {
      if (result.error) {
        logger.error(result.error)
        return
      }
    //   logger.info(result.connection, result.status, result.headers, parseString(result.body, function (err, result) {
 
 
  var obj = parse(result.body);

  // obj.root.children.map(function(e){ e.children.map(function(e2){ e2.children.map(function(e3){ 
  //   console.log(JSON.stringify(e2.attributes) +' : ' +JSON.stringify(e3.attributes)) 
  // }) } ) })
var devices = []
obj.root.children.map(function(e){ e.children.map(function(e2){ e2.children.map(function(e3){ 
  devices.push( {loc: e3.attributes, description: e2.attributes});
 }) } ) })


      var thisUpdateData = []
      var newDataCount = 0
      var oldDataCount = 0
      for (var i = 0; i < devices.length; i++) {
        var vehicleName = devices[i].description.id
        var currentUpdated = new Date(devices[i].loc.time)
        if (!(vehicleName in recentUpdated) || currentUpdated.getTime() > recentUpdated[vehicleName].getTime()) {
          logger.info('updating data for vehicle ' + vehicleName + ' at ' + currentUpdated)
          newDataCount = newDataCount + 1
          recentUpdated[vehicleName] = currentUpdated
          thisUpdateData.push(vehiclesData[i])
        } else {
          logger.info('got old data for vehicle ' + vehicleName + '; last updated at ' + recentUpdated[vehicleName])
          oldDataCount = oldDataCount + 1
        }
      }
      logger.info('got new new data for ' + newDataCount + ' vehicle' + (newDataCount > 1 ? 's' : '') + ' and old data for ' + oldDataCount + ' vehicle' + (oldDataCount > 1 ? 's' : ''))
  //     // writeUpdatesToDB(thisUpdateData)
    })
}

function writeUpdatesToDB (datalist) {
  var expectedRowsCount = datalist.length
  // for (var i = 0; i < datalist.length; i++) {
  //   expectedRowsCount = expectedRowsCount + datalist[i]['arrival_estimates'].length
  // }
  logger.info('inserting ' + expectedRowsCount + ' rows into the database')

  var startTime = (new Date()).getTime()
  pg.connect(config.pgconnstr, function (err, client, done) {
    if (err) {
      return logger.error('error fetching client from pool', err)
    }

    function sqlCallback (err, result) {
      if (err) {
        logger.error('error running query', err)
        return
      }
    // logger.info(JSON.stringify(result))
    }

    for (var i = 0; i < datalist.length; i++) {
      var d = datalist[i]
      client.query('INSERT INTO locations ' +
      '(id, call_name, last_updated_on, lat, lng, heading, speed, tracking_status, route_id, segment_id, data, geom) ' +
      'VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($3, $4), 4326) )' +
      'RETURNING id, call_name',
        [d['call_name'], d['last_updated_on'], d['location']['lat'], d['location']['lng'], d['heading'], d['speed'], d['tracking_status'], d['route_id'], d['segment_id'], d],
        sqlCallback)
    }
    done()
    var delta = (new Date()).getTime() - startTime
    logger.info('SQL INSERT took ' + delta + 'ms')
  })
}

(function () {
  setInterval(getMoovManage, config.UPDATE_INTERVAL)
})()

