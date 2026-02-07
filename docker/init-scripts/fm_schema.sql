create database if not exists farmers_market_db;
USE farmers_market_db;

create table if not exists vendors
(
    id            binary(16)           not null primary key,
    vendor        varchar(255)         not null,
    point_person  varchar(255)         not null,
    email         varchar(255)         not null,
    location      varchar(255)         null,
    miles         int                  null,
    products      varchar(255)         null,
    is_farmer     tinyint(1) default 0 null,
    is_produce    tinyint(1) default 0 null,
    woman_owned   tinyint(1) default 0 null,
    bipoc_owned   tinyint(1) default 0 null,
    veteran_owned tinyint(1) default 0 null,
    is_active     tinyint(1) default 1 null,
    constraint vendors_vendor_uindex
        unique (vendor)
);

create trigger before_insert_vendors
    before insert
    on vendors
    for each row
    set new.id = uuid_to_bin(uuid());


create table if not exists vendor_transactions
(
    id                   binary(16)           not null primary key,
    vendor_id            binary(16)           not null,
    vendor_name          varchar(255)         not null,
    market_date          date                 not null,
    present              tinyint(1) default 0 null,
    snap                 double               null,
    dufb                 double               null,
    wdfm_tokens          double               null,
    voucher              double               null,
    reimbursement_due    double               null,
    reported_sales       double               null,
    est_produce_sales    double               null,
    est_num_transactions bigint               null,
    foreign key (vendor_id) references vendors (id)
);

create trigger before_insert_vendor_transactions
    before insert
    on vendor_transactions
    for each row
    set new.id = uuid_to_bin(uuid());

create index vt_vendor_id_date_index
    on vendor_transactions (vendor_id, market_date);

create index vt_vendor_name_date_index
    on vendor_transactions (vendor_name, market_date);
