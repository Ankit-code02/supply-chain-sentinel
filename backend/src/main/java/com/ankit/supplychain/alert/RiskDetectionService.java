
package com.ankit.supplychain.alert;

import com.ankit.supplychain.shipment.Shipment;
import com.ankit.supplychain.shipment.ShipmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class RiskDetectionService {

    private final ShipmentRepository shipments;
    private final RiskAlertRepository alerts;

    public RiskDetectionService(
            ShipmentRepository shipments,
            RiskAlertRepository alerts) {
        this.shipments = shipments;
        this.alerts = alerts;
    }

    @Transactional
    public int scanOverdueShipments() {
        Instant now = Instant.now();
        int created = 0;

        List<Shipment> all = shipments.findAll();

        for (Shipment shipment : all) {
            Shipment.Status status = shipment.getStatus();

            if (status == Shipment.Status.DELIVERED
                    || status == Shipment.Status.CANCELLED
                    || !shipment.getExpectedDelivery().isBefore(now)) {
                continue;
            }

            shipment.setStatus(Shipment.Status.DELAYED);

            boolean alreadyOpen = alerts
                    .existsByShipment_IdAndRiskTypeAndStatus(
                            shipment.getId(),
                            "SHIPMENT_DELAY",
                            RiskAlert.Status.OPEN);

            if (!alreadyOpen) {
                alerts.save(new RiskAlert(
                        shipment,
                        "SHIPMENT_DELAY",
                        RiskAlert.Severity.HIGH,
                        "Shipment " + shipment.getReference()
                                + " is overdue. Expected delivery was "
                                + shipment.getExpectedDelivery() + "."
                ));
                created++;
            }
        }

        return created;
    }

    @Transactional(readOnly = true)
    public List<RiskAlert> findOpenAlerts() {
        return alerts.findOpenAlertsWithShipment(
                RiskAlert.Status.OPEN);
    }
}