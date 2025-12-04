package org.example.integradoranarvaez.assignment.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<AssignmentEntity, Long> {

    List<AssignmentEntity> findAllByIsActiveTrue();

    List<AssignmentEntity> findAllByDealer_Id(Long dealerId);

    List<AssignmentEntity> findAllByDealer_IdAndIsActiveTrue(Long dealerId);

    List<AssignmentEntity> findAllByStore_Id(Long storeId);

    List<AssignmentEntity> findAllByDealer_IdAndStore_IdAndIsActiveTrue(Long dealerId, Long storeId);

    List<AssignmentEntity> findAllByStore_IdAndIsActiveTrue(Long storeId);

    boolean existsByDealer_IdAndStore_IdAndIsActiveTrue(Long dealerId, Long storeId);

    boolean existsByDealer_IdAndStore_IdAndIsActiveTrueAndIdNot(Long dealerId, Long storeId, Long id);

    List<AssignmentEntity> findAllByDealer_IdAndIsActiveTrueAndStore_IsActiveTrue(Long dealerId);

}