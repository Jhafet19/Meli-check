package org.example.integradoranarvaez.visit_status;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VisitStatusRepository extends JpaRepository<VisitStatusEntity, Long> {

    Optional<VisitStatusEntity> findByCode(VisitStatusEnum code);

    boolean existsByCode(VisitStatusEnum code);
}