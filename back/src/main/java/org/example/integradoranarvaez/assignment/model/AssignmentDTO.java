package org.example.integradoranarvaez.assignment.model;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class AssignmentDTO {

    private Long id;

    @NotNull(message = "El ID del repartidor es obligatorio.")
    private Long dealerId;

    @NotNull(message = "El ID de la tienda es obligatorio.")
    private Long storeId;

    @NotBlank(message = "El tipo de asignación es obligatorio.")
    private String assignmentType; // "PERMANENT" o "TEMPORARY"

    @Positive(message = "La frecuencia debe ser mayor a 0.")
    private Integer frequencyDays; // obligatorio solo para PERMANENT

    private LocalDate startDate;   // obligatorio para TEMPORARY
    private LocalDate endDate;     // opcional, rango para TEMPORARY

    private Boolean isActive;

    public AssignmentDTO() {
    }

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) { this.id = id; }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) { this.dealerId = dealerId; }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(String assignmentType) { this.assignmentType = assignmentType; }

    public Integer getFrequencyDays() {
        return frequencyDays;
    }

    public void setFrequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) { isActive = active; }
}