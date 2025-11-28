package org.example.integradoranarvaez.order.model;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    boolean existsByInternalCode(String internalCode);
}