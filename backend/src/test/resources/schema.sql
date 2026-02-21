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

drop table if exists refresh_tokens;
drop table if exists users;

create table users
(
    id            binary(16) primary key,
    email         VARCHAR(255) not null,
    password_hash VARCHAR(255) not null,
    created_at    TIMESTAMP default current_timestamp,
    updated_at    TIMESTAMP
);

create table refresh_tokens
(
    id          binary(16) primary key,
    user_id     binary(16),
    token       VARCHAR(255) not null,
    expiry_date TIMESTAMP    not null,
    constraint fk_users_token foreign key (user_id) references users (id) on delete cascade
);