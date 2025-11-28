package org.example.integradoranarvaez.product.model;

import jakarta.validation.constraints.*;

public class ProductDTO {

    private Long id;

    @NotBlank
    @Size(min = 2, max = 150, message = "El nombre debe tener entre 2 y 150 caracteres.")
    private String name;

    @NotBlank
    @Size(min = 1, max = 100, message = "El SKU debe tener entre 1 y 100 caracteres.")
    private String sku;

    @NotBlank
    @Size(min = 1, max = 50, message = "La unidad debe tener entre 1 y 50 caracteres.")
    private String unit;

    @NotNull(message = "El precio es obligatorio.")
    @Positive(message = "El precio debe ser mayor a 0.")
    private Double price;

    private Boolean isActive;
    // URL de la imagen (la llena el backend cuando se sube archivo)
    private String imageUrl;

    public ProductDTO() {
    }

    // GETTERS & SETTERS

    public Long getId() {
        return id;
    }

    public void setId(Long id) { this.id = id; }

    public String getName() {
        return name;
    }

    public void setName(String name) { this.name = name; }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) { this.sku = sku; }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) { this.unit = unit; }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) { this.price = price; }

    public Boolean getIsActive() { return isActive; }

    public void setIsActive(Boolean active) { isActive = active; }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}