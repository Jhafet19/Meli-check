package org.example.integradoranarvaez.order_item.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {

    List<OrderItemEntity> findAllByOrder_Id(Long orderId);

    void deleteAllByOrder_Id(Long orderId);
}