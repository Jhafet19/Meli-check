package org.example.integradoranarvaez.assignment_type;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssignmentTypeRepository extends JpaRepository<AssignmentTypeEntity, Long> {

    boolean existsByCode(AssignmentTypeEnum code);

    Optional<AssignmentTypeEntity> findByCode(AssignmentTypeEnum typeEnum);
}