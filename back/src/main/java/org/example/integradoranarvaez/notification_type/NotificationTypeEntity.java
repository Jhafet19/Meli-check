package org.example.integradoranarvaez.notification_type;

import jakarta.persistence.*;

@Entity
@Table(name = "notification_types")
public class NotificationTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private NotificationTypeEnum code;

    @Column(name = "description", nullable = false, length = 150)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public NotificationTypeEnum getCode() {
        return code;
    }

    public void setCode(NotificationTypeEnum code) {
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