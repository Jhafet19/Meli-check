package org.example.integradoranarvaez.notification.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    List<NotificationEntity> findAllByUser_IdAndIsReadOrderByCreatedAtDesc(Long userId, Boolean isRead);

    Long countByUser_IdAndIsRead(Long userId, Boolean isRead);
}