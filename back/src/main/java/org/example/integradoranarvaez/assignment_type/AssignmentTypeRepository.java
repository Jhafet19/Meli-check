package org.example.integradoranarvaez.assignment_type;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentTypeRepository extends JpaRepository<AssignmentTypeEntity, Long> {

    boolean existsByCode(AssignmentTypeEnum code);
}