package org.example.integradoranarvaez.visit_status;

public enum VisitStatusEnum {
    PLANNED,       // En agenda, pendiente de realizar
    CHECKED_IN,    // El repartidor hizo check-in en la tienda
    COMPLETED,     // Visita completada
    SKIPPED        // Se saltó / no se realizó
}