CREATE TABLE inventory_items (
                                 id BIGSERIAL PRIMARY KEY,
                                 sku VARCHAR(60) NOT NULL UNIQUE,
                                 name VARCHAR(200) NOT NULL,
                                 category VARCHAR(100) NOT NULL,
                                 warehouse_location VARCHAR(150) NOT NULL,
                                 supplier_name VARCHAR(200) NOT NULL,
                                 quantity_on_hand INTEGER NOT NULL DEFAULT 0,
                                 reorder_point INTEGER NOT NULL,
                                 average_daily_demand NUMERIC(12, 3) NOT NULL DEFAULT 0,
                                 lead_time_days INTEGER NOT NULL,
                                 unit_cost NUMERIC(14, 2) NOT NULL,
                                 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT chk_inventory_quantity
                                     CHECK (quantity_on_hand >= 0),
                                 CONSTRAINT chk_inventory_reorder_point
                                     CHECK (reorder_point >= 0),
                                 CONSTRAINT chk_inventory_demand
                                     CHECK (average_daily_demand >= 0),
                                 CONSTRAINT chk_inventory_lead_time
                                     CHECK (lead_time_days >= 0),
                                 CONSTRAINT chk_inventory_unit_cost
                                     CHECK (unit_cost >= 0)
);

CREATE INDEX idx_inventory_location
    ON inventory_items(warehouse_location);

CREATE INDEX idx_inventory_category
    ON inventory_items(category);

CREATE TABLE inventory_movements (
                                     id BIGSERIAL PRIMARY KEY,
                                     inventory_item_id BIGINT NOT NULL
                                         REFERENCES inventory_items(id),
                                     movement_type VARCHAR(20) NOT NULL,
                                     quantity_delta INTEGER NOT NULL,
                                     reason VARCHAR(300) NOT NULL,
                                     reference VARCHAR(100),
                                     occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                     CONSTRAINT chk_inventory_movement_type
                                         CHECK (movement_type IN (
                                                                  'RECEIPT', 'CONSUMPTION', 'ADJUSTMENT', 'RETURN'
                                             )),
                                     CONSTRAINT chk_inventory_quantity_delta
                                         CHECK (quantity_delta <> 0)
);

CREATE INDEX idx_inventory_movements_item_time
    ON inventory_movements(inventory_item_id, occurred_at DESC);