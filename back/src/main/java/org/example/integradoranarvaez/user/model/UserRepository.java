package org.example.integradoranarvaez.user.model;

import org.example.integradoranarvaez.model.RoleEntity;
import org.example.integradoranarvaez.model.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String correo);
    boolean existsByEmail(String correo);

    List<UserEntity> findAllByRole(RoleEntity roleEntity);
    List<UserEntity> findAllByRole_RoleEnum(RoleEnum roleEnum);
}