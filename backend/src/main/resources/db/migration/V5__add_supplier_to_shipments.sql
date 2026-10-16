
ALTER TABLE shipments
    ADD COLUMN supplier_name VARCHAR(200);

CREATE INDEX idx_shipments_supplier_name
    ON shipments(supplier_name);
