
package com.ankit.supplychain.shipment;

public class ShipmentNotFoundException extends RuntimeException {

    public ShipmentNotFoundException(Long id) {
        super("Shipment not found: " + id);
    }
}
