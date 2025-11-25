package org.example.integradoranarvaez.order_status;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderStatusRepository extends JpaRepository<OrderStatusEntity, Long> {

    Optional<OrderStatusEntity> findByCode(OrderStatusEnum code);

    boolean existsByCode(OrderStatusEnum code);
}