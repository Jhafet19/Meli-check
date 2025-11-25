package org.example.integradoranarvaez.order_status;

public enum OrderStatusEnum {
    PENDING,      // Pedido creado pero no enviado
    SENT,         // Enviado / procesado
    CANCELLED,    // Cancelado manualmente
    REJECTED      // Rechazado por sistema externo
}
