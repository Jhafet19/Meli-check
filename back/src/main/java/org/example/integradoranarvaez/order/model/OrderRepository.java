package org.example.integradoranarvaez.order.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    boolean existsByInternalCode(String internalCode);

    // Buscar pedido por su identificador único offline (para prevenir duplicados)
    Optional<OrderEntity> findByOfflineUniqueId(String offlineUniqueId);

    @Query("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.items WHERE o.id = :id")
    Optional<OrderEntity> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT DISTINCT o FROM OrderEntity o LEFT JOIN FETCH o.items WHERE o.visit.id = :visitId")
    List<OrderEntity> findAllByVisit_Id(@Param("visitId") Long visitId);

    List<OrderEntity> findAllByDealer_Id(Long dealerId);
}