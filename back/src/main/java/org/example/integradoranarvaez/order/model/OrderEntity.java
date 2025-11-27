package org.example.integradoranarvaez.order.model;

import jakarta.persistence.*;
import org.example.integradoranarvaez.order_status.OrderStatusEntity;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.visit.model.VisitEntity;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Identificador interno (tu propio folio)
    @Column(name = "internal_code", length = 50, nullable = false, unique = true)
    private String internalCode;

    // Si luego sincronizas con sistema externo, puedes guardar su ID aquí
    @Column(name = "external_code", length = 100)
    private String externalCode;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Monto total del pedido (si aplica)
    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Pedido activo/inactivo (borrado lógico)
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ===================== RELACIONES =======================

    // Repartidor / DEALER asignado al pedido
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private UserEntity dealer;

    // Tienda asociada al pedido
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private StoreEntity store;

    // Estatus del pedido (catálogo)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_status_id", nullable = false)
    private OrderStatusEntity status;

   // Relación con visitas (opcional, si una visita puede tener muchos pedidos
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<VisitEntity> visits;

    // ===================== GETTERS/SETTERS ==================

    public Long getId() {
        return id;
    }

    public String getInternalCode() {
        return internalCode;
    }

    public void setInternalCode(String internalCode) {
        this.internalCode = internalCode;
    }

    public String getExternalCode() {
        return externalCode;
    }

    public void setExternalCode(String externalCode) {
        this.externalCode = externalCode;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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



    public OrderStatusEntity getStatus() {
        return status;
    }

    public void setStatus(OrderStatusEntity status) {
        this.status = status;
    }

    public Boolean getActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public List<VisitEntity> getVisits() {
        return visits;
    }

    public void setVisits(List<VisitEntity> visits) {
        this.visits = visits;
    }
}