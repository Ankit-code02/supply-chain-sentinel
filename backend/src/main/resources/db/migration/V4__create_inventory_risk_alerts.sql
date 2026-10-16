
CREATE TABLE inventory_risk_alerts (
                                       id BIGSERIAL PRIMARY KEY,
                                       inventory_item_id BIGINT NOT NULL
                                           REFERENCES inventory_items(id),
                                       risk_type VARCHAR(30) NOT NULL,
                                       severity VARCHAR(10) NOT NULL,
                                       message VARCHAR(1000) NOT NULL,
                                       status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                                       created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                       resolved_at TIMESTAMPTZ,

                                       CONSTRAINT chk_inventory_risk_type
                                           CHECK (risk_type IN ('LOW_STOCK', 'STOCKOUT_RISK')),

                                       CONSTRAINT chk_inventory_risk_severity
                                           CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

                                       CONSTRAINT chk_inventory_risk_status
                                           CHECK (status IN ('OPEN', 'RESOLVED'))
);

CREATE INDEX idx_inventory_risk_alerts_status
    ON inventory_risk_alerts(status);

CREATE INDEX idx_inventory_risk_alerts_item
    ON inventory_risk_alerts(inventory_item_id, created_at DESC);

CREATE UNIQUE INDEX uq_inventory_risk_alerts_open
    ON inventory_risk_alerts(inventory_item_id, risk_type)
    WHERE status = 'OPEN';
