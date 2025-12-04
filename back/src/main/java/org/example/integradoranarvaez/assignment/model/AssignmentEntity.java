package org.example.integradoranarvaez.assignment.model;

import jakarta.persistence.*;
import org.example.integradoranarvaez.assignment_type.AssignmentTypeEntity;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.user.model.UserEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Repartidor (DEALER)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private UserEntity dealer;

    // Tienda asignada
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private StoreEntity store;

    // Tipo de asignación: PERMANENT / TEMPORARY
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_type_id", nullable = false)
    private AssignmentTypeEntity assignmentType;

    // Frecuencia en días (ej: 7 = cada semana). Solo obligatorio para PERMANENT.
    @Column(name = "frequency_days")
    private Integer frequencyDays;

    // Fechas para manejo de temporales
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
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

    public AssignmentTypeEntity getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(AssignmentTypeEntity assignmentType) {
        this.assignmentType = assignmentType;
    }

    public Integer getFrequencyDays() {
        return frequencyDays;
    }

    public void setFrequencyDays(Integer frequencyDays) {
        this.frequencyDays = frequencyDays;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}