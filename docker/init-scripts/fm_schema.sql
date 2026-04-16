create table if not exists vendors
(
    id            binary(16)                not null primary key,
    vendor        varchar(255)              not null,
    point_person  varchar(255)              null,
    email         varchar(255)              null,
    location      varchar(255)              null,
    miles         int                       null,
    products      varchar(255)              null,
    avg_sale      double                    null,
    is_active     tinyint(1) default 1      not null,
    is_farmer     tinyint(1) default 0      not null,
    is_produce    tinyint(1) default 0      not null,
    woman_owned   tinyint(1) default 0      not null,
    bipoc_owned   tinyint(1) default 0      not null,
    veteran_owned tinyint(1) default 0      not null,
    created_at    timestamp  default now(),
    updated_at    timestamp on update now() null,
    constraint vendors_vendor_uindex unique (vendor)
);
create table if not exists vendor_transactions
(
    id                   binary(16)                not null primary key,
    vendor_id            binary(16)                not null,
    vendor_name          varchar(255)              not null,
    market_date          date                      not null,
    present              tinyint(1) default 0      null,
    snap                 double                    null,
    dufb                 double                    null,
    wdfm_tokens          double                    null,
    voucher              double                    null,
    reimbursement_due    double                    null,
    reported_sales       double                    null,
    est_produce_sales    double                    null,
    est_num_transactions bigint                    null,
    pct_handmade         double                    null,
    pct_agricultural     double                    null,
    pct_prepared_food    double                    null,
    pct_cottage_goods    double                    null,
    pct_manufactured     double                    null,
    custom_data          json                      null,
    created_at           timestamp  default now(),
    updated_at           timestamp on update now() null,
    foreign key (vendor_id) references vendors (id),
    constraint vt_vendor_id_market_date_uindex unique (vendor_id, market_date)
);
create index if not exists vt_vendor_id_date_index on vendor_transactions (vendor_id, market_date);;
create index if not exists vt_vendor_name_date_index on vendor_transactions (vendor_name, market_date);

create table if not exists custom_columns
(
    id             int primary key auto_increment,
    name           varchar(255),
    is_required    boolean  default false,
    type           varchar(255),
    check ( type in ('text', 'number', 'boolean', 'usd') ),
    created_at     datetime default current_timestamp,
    updated_at     datetime default current_timestamp on update current_timestamp,
    deactivated_at datetime,
    unique (name)
);
create index if not exists cc_name_idx on custom_columns (name);

create table if not exists users
(
    id            binary(16)                not null primary key,
    email         varchar(255)              not null unique,
    password_hash varchar(255)              not null,
    created_at    timestamp default now(),
    updated_at    timestamp on update now() null
);
create index if not exists users_email_index on users (email);

create table if not exists refresh_tokens
(
    id          binary(16) primary key,
    user_id     binary(16)   not null,
    token       VARCHAR(255) not null unique,
    expiry_date TIMESTAMP    not null,
    constraint fk_user foreign key (user_id) references users (id) on delete cascade
);

create table if not exists vendor_defaults
(
    id                binary(16) primary key,
    vendor_id         binary(16) unique not null,
    pct_handmade      DECIMAL(5, 2)     not null default 0.00,
    pct_agricultural  DECIMAL(5, 2)     not null default 0.00,
    pct_prepared_food DECIMAL(5, 2)     not null default 0.00,
    pct_cottage_goods DECIMAL(5, 2)     not null default 0.00,
    pct_manufactured  DECIMAL(5, 2)     not null default 0.00,
    constraint fk_vendor foreign key (vendor_id) references vendors (id) on delete cascade,
    constraint check_core_total check (
        (
            pct_handmade + pct_agricultural + pct_prepared_food + pct_cottage_goods + pct_manufactured
            ) = 100.00
        )
);

create table if not exists category_labels
(
    id    bigint auto_increment primary key,
    name  varchar(255) not null,
    color varchar(20)  null
);

create table if not exists vendor_category_labels
(
    vendor_id binary(16) not null,
    label_id  bigint     not null,
    primary key (vendor_id, label_id),
    foreign key (vendor_id) references vendors (id),
    foreign key (label_id) references category_labels (id)
);
