package org.example.integradoranarvaez.notification.control;

import org.example.integradoranarvaez.notification.model.NotificationService;
import org.example.integradoranarvaez.notification_type.NotificationTypeEnum;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"*"})
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<Message> getUserNotifications(@PathVariable Long userId) {
        return notificationService.getUserNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<Message> getUnreadNotifications(@PathVariable Long userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread/count")
    public ResponseEntity<Message> getUnreadCount(@PathVariable Long userId) {
        return notificationService.getUnreadCount(userId);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Message> markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Message> markAllAsRead(@PathVariable Long userId) {
        return notificationService.markAllAsRead(userId);
    }

    // Endpoint de prueba para enviar notificación manualmente
    @GetMapping("/test/{userId}")
    public ResponseEntity<Message> testNotification(@PathVariable Long userId) {
        try {
            notificationService.createNotification(
                    userId,
                    NotificationTypeEnum.NEW_ORDER_SENT,
                    "🧪 Prueba de Notificación",
                    "Esta es una notificación de prueba enviada manualmente desde el endpoint de test",
                    null
            );
            return ResponseEntity.ok(new Message("Notificación de prueba enviada correctamente", null, TypesResponse.SUCCESS));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new Message("Error enviando notificación: " + e.getMessage(), null, TypesResponse.ERROR));
        }
    }
}