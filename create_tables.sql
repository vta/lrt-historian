-- Table: public.locations

-- DROP TABLE public.locations;

CREATE TABLE public.locations
(
  id serial,
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
  geom geometry(Point,4326),
  CONSTRAINT locations_pkey PRIMARY KEY (id)
  CONSTRAINT locations_call_name_last_updated_on_key UNIQUE (call_name, last_updated_on)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.locations
  OWNER TO lrhistorianadmin;

-- Index: public.call_name_idx

-- DROP INDEX public.call_name_idx;

CREATE INDEX call_name_idx
  ON public.locations
  USING btree
  (call_name COLLATE pg_catalog."default");





