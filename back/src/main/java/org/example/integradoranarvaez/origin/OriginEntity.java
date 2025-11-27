package org.example.integradoranarvaez.origin;

import jakarta.persistence.*;

@Entity
@Table(name = "origins")
public class OriginEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private OriginEnum code;

    @Column(name = "description", nullable = false, length = 100)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public OriginEnum getCode() {
        return code;
    }

    public void setCode(OriginEnum code) {
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