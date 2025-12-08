package org.example.integradoranarvaez.notification.model;

import org.example.integradoranarvaez.notification_type.NotificationTypeEntity;
import org.example.integradoranarvaez.notification_type.NotificationTypeEnum;
import org.example.integradoranarvaez.notification_type.NotificationTypeRepository;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.example.integradoranarvaez.utils.APIResponse;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationTypeRepository notificationTypeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FCMService fcmService;

    @Transactional
    public void createNotification(Long userId, NotificationTypeEnum typeEnum, String title, String message, Long referenceId) {
        try {
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                System.err.println("Usuario no encontrado con ID: " + userId);
                return;
            }

            // Buscar el tipo de notificación
            NotificationTypeEntity type = notificationTypeRepository.findAll().stream()
                    .filter(t -> t.getCode() == typeEnum)
                    .findFirst()
                    .orElse(null);

            if (type == null) {
                System.err.println("Tipo de notificación no encontrado: " + typeEnum);
                return;
            }

            // Crear y guardar la notificación en la base de datos
            NotificationEntity notification = new NotificationEntity(type, user, title, message, referenceId);
            notificationRepository.save(notification);

            // Enviar notificación push si el usuario tiene token FCM
            if (user.getFcmToken() != null && !user.getFcmToken().isEmpty()) {
                fcmService.sendPushNotificationWithData(
                        user.getFcmToken(),
                        title,
                        message,
                        referenceId,
                        typeEnum.name()
                );
            } else {
                System.out.println("Usuario " + user.getEmail() + " no tiene token FCM registrado");
            }
        } catch (Exception e) {
            System.err.println("Error al crear notificación: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public ResponseEntity<Message> getUserNotifications(Long userId) {
        try {
            List<NotificationEntity> notifications = notificationRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(new Message("Notificaciones encontradas", notifications, TypesResponse.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Message("Error al obtener notificaciones", null, TypesResponse.ERROR));
        }
    }

    public ResponseEntity<Message> getUnreadNotifications(Long userId) {
        try {
            List<NotificationEntity> notifications = notificationRepository.findAllByUser_IdAndIsReadOrderByCreatedAtDesc(userId, false);
            return ResponseEntity.ok(new Message("Notificaciones no leídas encontradas", notifications, TypesResponse.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Message("Error al obtener notificaciones no leídas", null, TypesResponse.ERROR));
        }
    }

    public ResponseEntity<Message> getUnreadCount(Long userId) {
        try {
            Long count = notificationRepository.countByUser_IdAndIsRead(userId, false);
            return ResponseEntity.ok(new Message("Cantidad de notificaciones no leídas", count, TypesResponse.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Message("Error al contar notificaciones no leídas", null, TypesResponse.ERROR));
        }
    }

    @Transactional
    public ResponseEntity<Message> markAsRead(Long notificationId) {
        try {
            NotificationEntity notification = notificationRepository.findById(notificationId).orElse(null);
            if (notification == null) {
                return ResponseEntity.badRequest().body(new Message("Notificación no encontrada", null, TypesResponse.ERROR));
            }

            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);

            return ResponseEntity.ok(new Message("Notificación marcada como leída", notification, TypesResponse.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Message("Error al marcar notificación como leída", null, TypesResponse.ERROR));
        }
    }

    @Transactional
    public ResponseEntity<Message> markAllAsRead(Long userId) {
        try {
            List<NotificationEntity> unreadNotifications = notificationRepository.findAllByUser_IdAndIsReadOrderByCreatedAtDesc(userId, false);

            for (NotificationEntity notification : unreadNotifications) {
                notification.setIsRead(true);
                notification.setReadAt(LocalDateTime.now());
            }

            notificationRepository.saveAll(unreadNotifications);

            return ResponseEntity.ok(new Message("Todas las notificaciones marcadas como leídas", unreadNotifications.size(), TypesResponse.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Message("Error al marcar todas las notificaciones como leídas", null, TypesResponse.ERROR));
        }
    }
}