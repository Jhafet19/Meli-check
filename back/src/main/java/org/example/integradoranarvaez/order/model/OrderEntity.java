package org.example.integradoranarvaez.order.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.example.integradoranarvaez.order_item.model.OrderItemEntity;
import org.example.integradoranarvaez.order_status.OrderStatusEntity;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.visit.model.VisitEntity;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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

    // Identificador único del pedido offline (para prevenir duplicados al sincronizar)
    @Column(name = "offline_unique_id", length = 100, unique = true)
    private String offlineUniqueId;

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

    // Relación con la visita que generó este pedido
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id")
    private VisitEntity visit;

    // Líneas de productos del pedido
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItemEntity> items = new ArrayList<>();

    // Observaciones del pedido
    @Column(name = "notes", length = 1000)
    private String notes;

    // Fecha de envío (cuando se marca como SENT)
    @Column(name = "sent_at")
    private LocalDateTime sentAt;

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

    public VisitEntity getVisit() {
        return visit;
    }

    public void setVisit(VisitEntity visit) {
        this.visit = visit;
    }

    public List<OrderItemEntity> getItems() {
        return items;
    }

    public void setItems(List<OrderItemEntity> items) {
        this.items = items;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public StoreEntity getStore() {
        return store;
    }

    public void setStore(StoreEntity store) {
        this.store = store;
    }

    public String getOfflineUniqueId() {
        return offlineUniqueId;
    }

    public void setOfflineUniqueId(String offlineUniqueId) {
        this.offlineUniqueId = offlineUniqueId;
    }
}