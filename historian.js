'use strict'

const unirest = require('unirest')
const fs = require('fs')
const pg = require('pg')
const config = require('./config')
const logger = require('./log')

const VTA = '255'

var recentUpdated = {}

function getTransloc () {
  var Request = unirest.get('https://transloc-api-1-2.p.mashape.com/vehicles.json?agencies=' + VTA + '&callback=call')
  Request.proxy('http://localhost:3128')

  Request.header('X-Mashape-Key', config.TRANSLOC_API_KEY)
    .header('Accept', 'application/json')
    .end(function (result) {
      if (result.error) {
        logger.error(result.error)
        return
      }
      // logger.info(result.connection, result.status, result.headers, JSON.stringify(result.body), JSON.stringify(result))

      var vehiclesData = result.body['data'][VTA]

      if (!vehiclesData) {
        logger.error(JSON.stringify(result.body))
        return
      }

      var thisUpdateData = []
      var new_data_count = 0
      var old_data_count = 0
      for (var i = 0; i < vehiclesData.length; i++) {
        var vehicleName = vehiclesData[i]['call_name']
        var currentUpdated = new Date(vehiclesData[i]['last_updated_on'])
        if (!(vehicleName in recentUpdated) || currentUpdated.getTime() > recentUpdated[vehicleName].getTime()) {
          logger.info('updating data for vehicle ' + vehicleName + ' at ' + currentUpdated)
          new_data_count = new_data_count + 1
          recentUpdated[vehicleName] = currentUpdated
          thisUpdateData.push(vehiclesData[i])
        } else {
          logger.info('got old data for vehicle ' + vehicleName + '; last updated at ' + recentUpdated[vehicleName])
          old_data_count = old_data_count + 1
        }
      }
      logger.info('got new new data for ' + new_data_count + ' vehicle' + (new_data_count > 1 ? 's' : '') + ' and old data for ' + old_data_count + ' vehicle' + (old_data_count > 1 ? 's' : ''))
      writeUpdatesToDB(thisUpdateData)
    })
}

function writeUpdatesToDB (datalist) {
  var expected_rows_count = datalist.length
  for (var i = 0; i < datalist.length; i++) {
    expected_rows_count = expected_rows_count + datalist[i]['arrival_estimates'].length
  }
  logger.info('inserting ' + expected_rows_count + ' rows into the database')
  var startTime = (new Date()).getTime()
  pg.connect(config.pgconnstr, function (err, client, done) {
    if (err) {
      return logger.error('error fetching client from pool', err)
    }

    function sql_callback (err, result) {
      if (err) {
        logger.error('error running query', err)
        return
      }
    // logger.info(JSON.stringify(result))
    }

    for (var i = 0; i < datalist.length; i++) {
      var d = datalist[i]
      var a = null
      client.query('INSERT INTO locations ' +
      '(id, call_name, last_updated_on, lat, lng, heading, speed, tracking_status, route_id, segment_id) ' +
      'VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)' +
      'RETURNING id, call_name',
        [d['call_name'], d['last_updated_on'], d['location']['lat'], d['location']['lng'], d['heading'], d['speed'], d['tracking_status'], d['route_id'], d['segment_id']],
        function (err, result) {
          if (err) {
            logger.error('error running query', err)
            return
          }
          // consolelog(JSON.stringify(result))
          var current_data = null
          for (var j = 0; j < datalist.length; j++) {
            if (datalist[j]['call_name'] === result['rows'][0]['call_name']) {
              current_data = datalist[j]
            }
          }
          for (var j = 0; j < current_data['arrival_estimates'].length; j++) {
            a = current_data['arrival_estimates'][j]
            client.query('INSERT INTO arrival_estimates (route_id, arrival_at, stop_id, location_id) ' +
            'VALUES ($1, $2, $3, $4)',
              [a['route_id'], a['arrival_at'], a['stop_id'], result['rows'][0]['id']], sql_callback)
          }
        })
    }
    done()
    var delta = (new Date()).getTime() - startTime
    logger.info('SQL INSERT took ' + delta + 'ms')
  })
}

(function () {
  setInterval(getTransloc, config.UPDATE_INTERVAL)
})()
