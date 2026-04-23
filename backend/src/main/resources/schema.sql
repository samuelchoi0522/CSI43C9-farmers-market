create table if not exists vendors
(
    id            binary(16)                not null primary key,
    vendor        varchar(255)              not null,
    point_person  varchar(255)              null,
    email         varchar(255)              null,
    location      varchar(255)              null,
    miles         int                       null,
    products      varchar(255)              null,
    is_active     tinyint(1) default 1      not null,
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
    avg_sale             double                    null,
    custom_data          text                      null,
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

create table if not exists vendor_defaults
(
    id                binary(16) primary key,
    vendor_id         binary(16) unique not null,
    pct_handmade      DECIMAL(5, 2)     not null default 0.00,
    pct_agricultural  DECIMAL(5, 2)     not null default 0.00,
    pct_prepared_food DECIMAL(5, 2)     not null default 0.00,
    pct_cottage_goods DECIMAL(5, 2)     not null default 0.00,
    pct_manufactured  DECIMAL(5, 2)     not null default 0.00,
    avg_sale          double                    null,
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

create table if not exists market_goals
(
    id            bigint auto_increment primary key,
    name          varchar(255)              not null,
    start_date    date                      not null,
    end_date      date                      not null,
    metric        varchar(64)               not null,
    target_value  double                    not null,
    created_at    timestamp default current_timestamp,
    updated_at    timestamp default current_timestamp on update current_timestamp,
    check ( end_date >= start_date )
);
-- Metric values validated in MarketGoalService (avoids DB 409s when adding new metrics; relax old CHECKs by recreating DB or ALTER).
create index if not exists market_goals_dates_idx on market_goals (start_date, end_date);

create table if not exists market_day_data
(
    market_date                   date                      not null primary key,
    snap_token_transactions       int                       default 0,
    snap_tokens_purchased         double                    default 0.0,
    snap_tokens_redeemed          double                    default 0.0,
    dufb_token_transactions       int                       default 0,
    dufb_tokens_distributed       double                    default 0.0,
    dufb_tokens_redeemed          double                    default 0.0,
    wdfm_token_transactions       int                       default 0,
    wdfm_tokens_purchased         double                    default 0.0,
    gift_cards_redeemed           double                    default 0.0,
    wdfm_tokens_for_market_meals  double                    default 0.0,
    wdfm_tokens_redeemed          double                    default 0.0,
    created_at                    timestamp  default now(),
    updated_at                    timestamp on update now() null
);
