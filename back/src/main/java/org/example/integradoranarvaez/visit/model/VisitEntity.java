package org.example.integradoranarvaez.visit.model;


import jakarta.persistence.*;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.order.model.OrderEntity;
import org.example.integradoranarvaez.visit_status.VisitStatusEntity;
// TODO: cambiar el import al package real de StoreEntity

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "visits")
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

    // ===================== GETTERS/SETTERS ==================
    public Long getId() {
        return id;
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

}