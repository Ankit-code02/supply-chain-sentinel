
CREATE TABLE risk_alerts (
                             id BIGSERIAL PRIMARY KEY,
                             shipment_id BIGINT NOT NULL REFERENCES shipments(id),
                             risk_type VARCHAR(40) NOT NULL,
                             severity VARCHAR(20) NOT NULL,
                             message VARCHAR(500) NOT NULL,
                             status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                             created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             CONSTRAINT chk_risk_alert_severity
                                 CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

                             CONSTRAINT chk_risk_alert_status
                                 CHECK (status IN ('OPEN', 'RESOLVED'))
);

CREATE UNIQUE INDEX uq_open_shipment_risk
    ON risk_alerts(shipment_id, risk_type)
    WHERE status = 'OPEN';

CREATE INDEX idx_risk_alerts_status
    ON risk_alerts(status);
