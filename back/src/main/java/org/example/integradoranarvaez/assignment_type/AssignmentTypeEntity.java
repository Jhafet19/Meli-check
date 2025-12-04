package org.example.integradoranarvaez.assignment_type;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "assignment_types")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssignmentTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private AssignmentTypeEnum code;

    @Column(name = "description", nullable = false, length = 100)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public AssignmentTypeEnum getCode() {
        return code;
    }

    public void setCode(AssignmentTypeEnum code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}