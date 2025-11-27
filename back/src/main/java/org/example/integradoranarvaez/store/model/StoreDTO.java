package org.example.integradoranarvaez.store.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class StoreDTO {

    private Long id;

    @NotBlank
    @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres.")
    private String name;

    @NotBlank
    @Size(min = 5, max = 255, message = "La dirección debe tener entre 5 y 255 caracteres.")
    private String address;

    @NotNull(message = "La latitud es obligatoria.")
    private Double latitude;

    @NotNull(message = "La longitud es obligatoria.")
    private Double longitude;

    // Este puede venir del front o lo puedes generar tú; por ahora lo recibimos
    @Size(max = 100)
    private String qrCode;

    private Boolean isActive;

    public StoreDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}