package org.example.integradoranarvaez.notification_type;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTypeRepository extends JpaRepository<NotificationTypeEntity, Long> {

    boolean existsByCode(NotificationTypeEnum code);
}