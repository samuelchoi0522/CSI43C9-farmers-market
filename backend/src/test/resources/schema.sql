drop table if exists vendors;
drop table if exists vendor_transactions;

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

create table vendor_transactions
(
    id                   binary(16) primary key,
    vendor_id            binary(16) not null,
    vendor_name          varchar(255) not null,
    market_date          date         not null,
    present              boolean   default false,
    snap                 double,
    dufb                 double,
    wdfm_tokens          double,
    voucher              double,
    reimbursement_due    double,
    reported_sales       double,
    est_produce_sales    double,
    est_num_transactions bigint,
    pct_handmade         double,
    pct_agricultural     double,
    pct_prepared_food    double,
    pct_cottage_goods    double,
    pct_manufactured     double,
    custom_data          json,
    created_at           timestamp default current_timestamp,
    updated_at           timestamp
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

drop table if exists custom_columns cascade;

create table custom_columns
(
    id             INT auto_increment primary key,
    name           VARCHAR(255) not null,
    is_required    boolean   default false,
    type           VARCHAR(255) null,
    created_at     TIMESTAMP default current_timestamp,
    updated_at     TIMESTAMP default current_timestamp,
    deactivated_at TIMESTAMP,
    constraint cc_name_unique unique (name)
);

create index cc_name_idx
    on custom_columns (name);
