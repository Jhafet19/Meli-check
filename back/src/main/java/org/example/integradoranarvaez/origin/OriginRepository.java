package org.example.integradoranarvaez.origin;


import org.springframework.data.jpa.repository.JpaRepository;

public interface OriginRepository extends JpaRepository<OriginEntity, Long> {

    boolean existsByCode(OriginEnum code);
}