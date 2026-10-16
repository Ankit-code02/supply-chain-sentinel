
CREATE TABLE shipments (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(50) NOT NULL UNIQUE,
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    expected_delivery TIMESTAMPTZ NOT NULL,
    actual_delivery TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_shipments_status
        CHECK (status IN (
            'PENDING',
            'IN_TRANSIT',
            'DELAYED',
            'DELIVERED',
            'CANCELLED'
        ))
);

CREATE INDEX idx_shipments_status
    ON shipments(status);

CREATE INDEX idx_shipments_expected_delivery
    ON shipments(expected_delivery);
