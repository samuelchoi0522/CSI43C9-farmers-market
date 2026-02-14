drop table if exists vendors;

create table vendors
(
    id            binary(16) primary key,
    vendor        VARCHAR(255) not null,
    point_person  VARCHAR(255),
    email         VARCHAR(255),
    location      VARCHAR(255),
    miles         INT,
    products      VARCHAR(255),
    is_active     boolean default true,
    is_farmer     boolean default false,
    is_produce    boolean default false,
    woman_owned   boolean default false,
    bipoc_owned   boolean default false,
    veteran_owned boolean default false
);