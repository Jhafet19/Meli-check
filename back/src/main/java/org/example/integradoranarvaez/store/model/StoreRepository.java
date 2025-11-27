package org.example.integradoranarvaez.store.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<StoreEntity, Long> {

    boolean existsByName(String name);

    boolean existsByQrCode(String qrCode);

    Optional<StoreEntity> findByQrCode(String qrCode);

    List<StoreEntity> findAllByIsActiveTrue();
}