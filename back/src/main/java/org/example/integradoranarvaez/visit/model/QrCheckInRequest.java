package org.example.integradoranarvaez.visit.model;


import jakarta.validation.constraints.NotNull;

public class QrCheckInRequest {

    @NotNull(message = "El código QR es obligatorio")
    private String qrCode;

    @NotNull(message = "La latitud es obligatoria")
    private Double latitude;

    @NotNull(message = "La longitud es obligatoria")
    private Double longitude;

    // Getters y Setters
    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}