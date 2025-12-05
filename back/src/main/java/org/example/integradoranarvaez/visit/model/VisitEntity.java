package org.example.integradoranarvaez.visit.model;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.example.integradoranarvaez.assignment.model.AssignmentEntity;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.order.model.OrderEntity;
import org.example.integradoranarvaez.visit_status.VisitStatusEntity;
// TODO: cambiar el import al package real de StoreEntity

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "visits")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VisitEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Fecha planeada de la visita
    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    // Hora/fecha de check-in (cuando el dealer llega a la tienda)
    @Column(name = "check_in_at")
    private LocalDateTime checkInAt;

    // Hora/fecha de check-out (cuando termina la visita)
    @Column(name = "check_out_at")
    private LocalDateTime checkOutAt;

    // Comentarios/notas del repartidor o admin
    @Column(name = "notes", length = 500)
    private String notes;

    // Borrado lógico de la visita
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ============== NUEVOS CAMPOS ==============

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", length = 20)
    private VisitOrigin origin = VisitOrigin.OFFLINE;

    @Column(name = "checkin_lat")
    private Double checkinLat;

    @Column(name = "checkin_lng")
    private Double checkinLng;

    @Column(name = "checkout_lat")
    private Double checkoutLat;

    @Column(name = "checkout_lng")
    private Double checkoutLng;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    // Timestamps
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================== RELACIONES =======================

    // Dealer que realiza la visita
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private UserEntity dealer;

    // Tienda de la visita
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private StoreEntity store;

    // Pedido asociado (puede ser opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    // Estatus de la visita (catálogo)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_status_id", nullable = false)
    private VisitStatusEntity status;

    // Asignación (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private AssignmentEntity assignment;

    // ===================== GETTERS/SETTERS ==================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(LocalDate visitDate) {
        this.visitDate = visitDate;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public UserEntity getDealer() {
        return dealer;
    }

    public void setDealer(UserEntity dealer) {
        this.dealer = dealer;
    }

    public StoreEntity getStore() {
        return store;
    }

    public void setStore(StoreEntity store) {
        this.store = store;
    }

    public OrderEntity getOrder() {
        return order;
    }

    public void setOrder(OrderEntity order) {
        this.order = order;
    }

    public VisitStatusEntity getStatus() {
        return status;
    }

    public void setStatus(VisitStatusEntity status) {
        this.status = status;
    }


    public VisitOrigin getOrigin() {
        return origin;
    }

    public void setOrigin(VisitOrigin origin) {
        this.origin = origin;
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

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public AssignmentEntity getAssignment() {
        return assignment;
    }

    public void setAssignment(AssignmentEntity assignment) {
        this.assignment = assignment;
    }
}