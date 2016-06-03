[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

# Light Rail Historian

Makes use of the [TransLoc API](https://market.mashape.com/transloc/openapi-1-2)


The PostgreSQL 9.4+ table should be created with:

    CREATE TABLE locations (
        id serial PRIMARY KEY,
        data jsonb
    );

It may also be helpful to make an index on some of the values:

    CREATE INDEX vehicle_idx ON locations ((data->>'call_name'));

    CREATE INDEX call_name_idx ON locations (call_name);
    CREATE INDEX location_id_idx ON arrival_estimates (location_id);
    CREATE INDEX route_id_idx ON arrival_estimates (route_id);

To select a portion of the data, like all the lat/lng positions for vehicle 933A, try something like this:

    SELECT (data->>'location') as vehicle FROM locations WHERE (data->>'call_name') = '933A';


To get all the data available between two date ranges, use:
```
-- selecting dates betwen timestamp ranges for a certain vehicle
-- WARNING: this can take a long time due to the amount of data!
SELECT data ->> 'call_name' AS vehicle, 
       data #>> '{location, lat}' AS lat, 
       data #>> '{location, lng}' AS lng, 
       To_timestamp(Replace(data ->> 'last_updated_on', 'T', ' '), 
       'YYYY-MM-DD"T"HH24:MI:SS') AS last_updated_on, 
       data 
FROM   locations 
WHERE  To_timestamp(Replace(data ->> 'last_updated_on', 'T', ' '), 
              'YYYY-MM-DD"T"HH24:MI:SS') >= '2016-06-01 00:00:00' :: timestamp 
       AND To_timestamp(Replace(data ->> 'last_updated_on', 'T', ' '), 
               'YYYY-MM-DD"T"HH24:MI:SS') <= '2016-06-02 00:00:00' :: timestamp;
```

To get the above for a certain vehicle, use:
```
-- selecting dates betwen timestamp ranges for a certain vehicle
-- WARNING: this can take a long time due to the amount of data!
SELECT data ->> 'call_name' AS vehicle, 
       data #>> '{location, lat}' AS lat, 
       data #>> '{location, lng}' AS lng, 
       To_timestamp(Replace(data ->> 'last_updated_on', 'T', ' '), 
       'YYYY-MM-DD"T"HH24:MI:SS') AS last_updated_on, 
       data 
FROM   locations 
WHERE  To_timestamp(Replace(data ->> 'last_updated_on', 'T', ' '), 
              'YYYY-MM-DD"T"HH24:MI:SS') >= '2016-06-01 00:00:00' :: timestamp 
       AND To_timestamp(Replace(data ->> 'last_updated_on', 'T', ' '), 
               'YYYY-MM-DD"T"HH24:MI:SS') <= '2016-06-02 00:00:00' :: timestamp 
       AND data ->> 'call_name' = '948A';
```



This query uses date conversions on the data
```
-- getting the date from the jsonb data
SELECT ( data ->> 'last_updated_on' ) AS last_updated_on 
FROM   locations 
LIMIT  10; 
```


```
-- date conversion
SELECT ( data ->> 'last_updated_on' ) AS original, 
       REPLACE(data ->> 'last_updated_on', 'T', ' ') AS replaced, 
       To_char(To_timestamp(REPLACE(data ->> 'last_updated_on', 'T', ' '), 
                       'YYYY-MM-DD"T"HH24:MI:SS'), 'YYYY-MM-DD HH24:MI:SS') AS converted 
FROM   locations 
LIMIT  10; 
```




```
-- to check the disk usage of the table:
SELECT pg_size_pretty(pg_relation_size('locations'));
```

jsonb : 40692 rows takes up 33 MB











## Pure SQL:

select * from locations_x_arrival_estimates
WHERE 
last_updated_on >= '2016-06-01 00:00:00' :: timestamp 
AND
last_updated_on <= '2016-06-03 00:00:00' :: timestamp
--AND call_name = '901A'
--AND speed > 80
--ORDER BY speed DESC
limit 10000;





SELECT row_to_json(
	ROW(l.call_name, ROW(a.* ) )
)
FROM locations l
JOIN arrival_estimates a on l.id=a.location_id





SELECT json_build_object(
	'id', l.id,
	'last_updated_on', l.last_updated_on,
	'call_name', l.call_name,
	 'arrival_estimates', json_build_array(a.*)
)
FROM locations l
JOIN arrival_estimates a on l.id=a.location_id

WHERE call_name = '901A'
--AND speed > 80
--ORDER BY speed DESC
LIMIT 1000




-- delete all the things
TRUNCATE arrival_estimates CASCADE;
TRUNCATE locations CASCADE;




-- get stats from both tables
SELECT 
(SELECT COUNT(*) from locations) as locations_count, 
(SELECT pg_size_pretty(pg_relation_size('locations'))) AS locations_size,
(SELECT COUNT(*) from arrival_estimates) as arrival_estimates_count,
(SELECT pg_size_pretty(pg_relation_size('arrival_estimates'))) AS arrival_estimates_size
