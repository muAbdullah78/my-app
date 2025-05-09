-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create custom types
create type user_role as enum ('customer', 'shop_owner', 'driver');
create type order_status as enum ('pending', 'confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type payment_method as enum ('card', 'apple_pay', 'google_pay');

-- Create users table
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    phone text unique not null,
    role user_role not null default 'customer',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_profiles table
create table public.user_profiles (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users on delete cascade not null,
    full_name text not null,
    email text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shops table
create table public.shops (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.users on delete cascade not null,
    name text not null,
    description text,
    address text not null,
    location geography(Point) not null,
    phone text not null,
    email text,
    opening_hours jsonb not null,
    rating decimal(3,2) default 0,
    total_ratings integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create services table
create table public.services (
    id uuid default uuid_generate_v4() primary key,
    shop_id uuid references public.shops on delete cascade not null,
    name text not null,
    description text,
    price decimal(10,2) not null,
    duration interval not null,
    is_express boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create orders table
create table public.orders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users on delete cascade not null,
    shop_id uuid references public.shops on delete cascade not null,
    status order_status not null default 'pending',
    total_amount decimal(10,2) not null,
    delivery_address text not null,
    delivery_location geography(Point) not null,
    scheduled_pickup timestamp with time zone,
    scheduled_delivery timestamp with time zone,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create order_items table
create table public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders on delete cascade not null,
    service_id uuid references public.services on delete cascade not null,
    quantity integer not null,
    price decimal(10,2) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payments table
create table public.payments (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders on delete cascade not null,
    amount decimal(10,2) not null,
    currency text not null default 'usd',
    status payment_status not null default 'pending',
    payment_method payment_method not null,
    payment_intent_id text,
    receipt_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reviews table
create table public.reviews (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users on delete cascade not null,
    shop_id uuid references public.shops on delete cascade not null,
    order_id uuid references public.orders on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    photos text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create messages table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    sender_id uuid references public.users on delete cascade not null,
    receiver_id uuid references public.users on delete cascade not null,
    order_id uuid references public.orders on delete cascade,
    content text not null,
    attachments text[],
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create saved_addresses table
create table public.saved_addresses (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users on delete cascade not null,
    address text not null,
    location geography(Point) not null,
    is_default boolean default false,
    label text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create loyalty_points table
create table public.loyalty_points (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users on delete cascade not null,
    shop_id uuid references public.shops on delete cascade not null,
    points integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users on delete cascade not null,
    title text not null,
    body text not null,
    data jsonb,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create service_categories table
create table public.service_categories (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create service_pricing_rules table
create table public.service_pricing_rules (
    id uuid default uuid_generate_v4() primary key,
    service_id uuid references public.services on delete cascade not null,
    min_quantity integer not null,
    max_quantity integer,
    price_multiplier decimal(3,2) not null default 1.00,
    is_express boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create special_requests table
create table public.special_requests (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders on delete cascade not null,
    request_type text not null,
    description text not null,
    additional_cost decimal(10,2),
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create service_schedules table
create table public.service_schedules (
    id uuid default uuid_generate_v4() primary key,
    shop_id uuid references public.shops on delete cascade not null,
    service_id uuid references public.services on delete cascade not null,
    day_of_week integer not null check (day_of_week between 0 and 6),
    start_time time not null,
    end_time time not null,
    max_capacity integer not null,
    current_bookings integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create bulk_orders table
create table public.bulk_orders (
    id uuid default uuid_generate_v4() primary key,
    order_id uuid references public.orders on delete cascade not null,
    quantity integer not null,
    unit_price decimal(10,2) not null,
    total_price decimal(10,2) not null,
    discount_percentage decimal(5,2),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add new columns to services table
alter table public.services
add column category_id uuid references public.service_categories on delete set null,
add column base_price decimal(10,2) not null,
add column min_processing_time interval not null,
add column max_processing_time interval not null,
add column is_express_available boolean default false,
add column express_surcharge decimal(10,2),
add column bulk_discount_threshold integer,
add column bulk_discount_percentage decimal(5,2);

-- Create RLS policies
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.shops enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.notifications enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_pricing_rules enable row level security;
alter table public.special_requests enable row level security;
alter table public.service_schedules enable row level security;
alter table public.bulk_orders enable row level security;

-- Create indexes
create index idx_shops_location on public.shops using gist(location);
create index idx_orders_delivery_location on public.orders using gist(delivery_location);
create index idx_saved_addresses_location on public.saved_addresses using gist(location);
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_shop_id on public.orders(shop_id);
create index idx_messages_sender_receiver on public.messages(sender_id, receiver_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_service_pricing_rules_service_id on public.service_pricing_rules(service_id);
create index idx_special_requests_order_id on public.special_requests(order_id);
create index idx_service_schedules_shop_service on public.service_schedules(shop_id, service_id);
create index idx_bulk_orders_order_id on public.bulk_orders(order_id);

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, phone, role)
    values (new.id, new.phone, 'customer');
    return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 