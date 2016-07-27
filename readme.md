[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

# Light Rail Historian

Collects and stores realtime light rail geolocation data, like latitude, longitude, time, expected arrival times.

Makes use of the [TransLoc API](https://market.mashape.com/transloc/openapi-1-2)


Before trying to run this program, see that you have PostreSQL 9.4 or later installed, with a database set up. 

Make a copy of config.js.example, name it "config.js", replacing the values to match your configuration. Configure the database connection string, the username to use for accessing the tables that will be created, and any other parameters you may wish to define.



## Accessing the data
Right now, SQL queries are the only way to explore the data being written to the database. Here are some common queries being used:

```
-- select the important bits
select call_name, last_updated_on, lat, lng, heading, tracking_status, speed, route_id, segment_id from locations
WHERE 
last_updated_on >= '2016-06-01 00:00:00' :: timestamp 
AND
last_updated_on <= '2016-06-05 00:00:00' :: timestamp
--AND call_name = '901A'
--AND speed > 80
--ORDER BY speed DESC
limit 10000;
```

```
-- select original json data
select data from locations
WHERE 
last_updated_on >= '2016-06-01 00:00:00' :: timestamp 
AND
last_updated_on <= '2016-06-05 00:00:00' :: timestamp
--AND call_name = '901A'
--AND speed > 80
--ORDER BY speed DESC
limit 10000;
```



```
-- get stats about the locations table 
SELECT 
(SELECT COUNT(*) from locations) as locations_count, 
(SELECT pg_size_pretty(pg_relation_size('locations'))) AS locations_size
```

```
-- delete all the things
-- USE WITH CAUTION!
TRUNCATE arrival_estimates CASCADE;
TRUNCATE locations CASCADE;
```
