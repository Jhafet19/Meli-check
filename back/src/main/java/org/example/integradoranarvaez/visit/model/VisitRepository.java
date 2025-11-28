package org.example.integradoranarvaez.visit.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VisitRepository extends JpaRepository<VisitEntity, Long> {
    List<VisitEntity> findAllByDealer_Id(Long dealerId);
}