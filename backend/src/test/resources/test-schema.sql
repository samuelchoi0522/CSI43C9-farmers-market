create table if not exists vendors
(
    id            binary(16)                not null primary key,
    vendor        varchar(255)              not null,
    point_person  varchar(255)              null,
    email         varchar(255)              null,
    location      varchar(255)              null,
    miles         int                       null,
    products      varchar(255)              null,
    is_active     boolean default 1      null,
    created_at    timestamp  default now(),
    updated_at    timestamp on update now() null
);
create table if not exists vendor_transactions
(
    id                   binary(16)                not null primary key,
    vendor_id            binary(16)                not null,
    vendor_name          varchar(255)              not null,
    market_date          date                      not null,
    present              boolean default 0      null,
    snap                 double                    null,
    dufb                 double                    null,
    wdfm_tokens          double                    null,
    voucher              double                    null,
    reimbursement_due    double                    null,
    reported_sales       double                    null,
    est_produce_sales    double                    null,
    est_num_transactions bigint                    null,
    pct_handmade         double,
    pct_agricultural     double,
    pct_prepared_food    double,
    pct_cottage_goods    double,
    pct_manufactured     double,
    avg_sale             double,
    custom_data          text                      null,
    created_at           timestamp  default now(),
    updated_at           timestamp on update now() null
);
create index if not exists vt_vendor_id_date_index on vendor_transactions (vendor_id, market_date);;
create index if not exists vt_vendor_name_date_index on vendor_transactions (vendor_name, market_date);

create table if not exists custom_columns
(
    id             int primary key auto_increment,
    name           varchar(255),
    is_required    boolean  default false,
    type           varchar(255),
    created_at     timestamp default current_timestamp,
    updated_at     timestamp default current_timestamp on update current_timestamp,
    deactivated_at timestamp,
    unique (name)
);
create index if not exists cc_name_idx on custom_columns (name);

create table if not exists vendor_defaults
(
    id                binary(16) primary key,
    vendor_id         binary(16) unique not null,
    pct_handmade      DECIMAL(5, 2)     not null default 0.00,
    pct_agricultural  DECIMAL(5, 2)     not null default 0.00,
    pct_prepared_food DECIMAL(5, 2)     not null default 0.00,
    pct_cottage_goods DECIMAL(5, 2)     not null default 0.00,
    pct_manufactured  DECIMAL(5, 2)     not null default 0.00
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
    primary key (vendor_id, label_id)
);
