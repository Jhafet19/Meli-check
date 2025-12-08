package org.example.integradoranarvaez.notification.model;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;

@Service
public class FCMService {

    public void sendPushNotification(String fcmToken, String title, String body) {
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Notificación enviada exitosamente: " + response);
        } catch (Exception e) {
            System.err.println("Error al enviar notificación: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendPushNotificationWithData(String fcmToken, String title, String body, Long referenceId, String type) {
        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (referenceId != null) {
                messageBuilder.putData("referenceId", referenceId.toString());
            }
            if (type != null) {
                messageBuilder.putData("type", type);
            }

            Message message = messageBuilder.build();
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Notificación con datos enviada exitosamente: " + response);
        } catch (Exception e) {
            System.err.println("Error al enviar notificación con datos: " + e.getMessage());
            e.printStackTrace();
        }
    }
}