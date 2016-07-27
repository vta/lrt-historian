-- Table: locations

-- DROP TABLE locations;

CREATE TABLE locations
(
  id serial NOT NULL,
  call_name character varying(10) NOT NULL,
  last_updated_on timestamp with time zone,
  lat double precision,
  lng double precision,
  heading integer,
  tracking_status character varying(10),
  speed double precision,
  route_id character varying(20),
  segment_id character varying(20),
  data jsonb,
  CONSTRAINT locations_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE locations
  OWNER TO lrhistorianadmin;

-- Index: call_name_idx

-- DROP INDEX call_name_idx;

CREATE INDEX call_name_idx
  ON locations
  USING btree
  (call_name COLLATE pg_catalog."default");






-- Table: arrival_estimates

-- DROP TABLE arrival_estimates;

CREATE TABLE arrival_estimates
(
  route_id character varying(20),
  arrival_at timestamp with time zone,
  stop_id character varying(20),
  location_id integer,
  id serial NOT NULL,
  CONSTRAINT arrival_estimates_pkey PRIMARY KEY (id),
  CONSTRAINT location FOREIGN KEY (location_id)
      REFERENCES locations (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
)
WITH (
  OIDS=FALSE
);
ALTER TABLE arrival_estimates
  OWNER TO lrhistorianadmin;


-- Index: fki_location

-- DROP INDEX fki_location;

CREATE INDEX fki_location
  ON arrival_estimates
  USING btree
  (location_id);




-- Index: route_id_idx

-- DROP INDEX route_id_idx;

CREATE INDEX route_id_idx
  ON arrival_estimates
  USING btree
  (route_id);




CREATE VIEW locations_x_arrival_estimates as
  SELECT l.call_name, l.last_updated_on, l.lat, l.lng, l.heading, l.tracking_status, l.speed, l.segment_id, a.route_id, a.stop_id, a.arrival_at 
    FROM locations l
    JOIN arrival_estimates a on l.id=a.location_id;

ALTER VIEW locations_x_arrival_estimates
  OWNER TO lrhistorianadmin;