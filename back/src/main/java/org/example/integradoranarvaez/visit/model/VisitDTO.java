package org.example.integradoranarvaez.visit.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class VisitDTO {
    private Long id;

    @NotNull
    private Long dealerId;

    @NotNull
    private Long storeId;

    private Long statusId;

    private Long assignmentId;

    private Long orderId;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate visitDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate scheduledDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkInAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkOutAt;

    private Double checkinLat;

    private Double checkinLng;

    private Double checkoutLat;

    private Double checkoutLng;

    private String notes;

    private VisitOrigin origin;

    private Boolean isActive = true;

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) {
        this.dealerId = dealerId;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public Long getStatusId() {
        return statusId;
    }

    public void setStatusId(Long statusId) {
        this.statusId = statusId;
    }

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalDateTime getCheckInAt() {
        return checkInAt;
    }

    public void setCheckInAt(LocalDateTime checkInAt) {
        this.checkInAt = checkInAt;
    }

    public LocalDateTime getCheckOutAt() {
        return checkOutAt;
    }

    public void setCheckOutAt(LocalDateTime checkOutAt) {
        this.checkOutAt = checkOutAt;
    }

    public Double getCheckinLat() {
        return checkinLat;
    }

    public void setCheckinLat(Double checkinLat) {
        this.checkinLat = checkinLat;
    }

    public Double getCheckinLng() {
        return checkinLng;
    }

    public void setCheckinLng(Double checkinLng) {
        this.checkinLng = checkinLng;
    }

    public Double getCheckoutLat() {
        return checkoutLat;
    }

    public void setCheckoutLat(Double checkoutLat) {
        this.checkoutLat = checkoutLat;
    }


    public Double getCheckoutLng() {
        return checkoutLng;
    }

    public void setCheckoutLng(Double checkoutLng) {
        this.checkoutLng = checkoutLng;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public VisitOrigin getOrigin() {
        return origin;
    }

    public void setOrigin(VisitOrigin origin) {
        this.origin = origin;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

}