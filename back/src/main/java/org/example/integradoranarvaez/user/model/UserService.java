package org.example.integradoranarvaez.user.model;

import org.example.integradoranarvaez.config.DataInitializer;
import org.example.integradoranarvaez.model.RoleEntity;
import org.example.integradoranarvaez.model.RoleEnum;
import org.example.integradoranarvaez.model.RoleRepository;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    //private final AuditLogService auditLogService;

    public static Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    public UserService(UserRepository repository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(rollbackFor = {SQLException.class})
    public ResponseEntity<Message> saveUserWithRole(UserDTO dto, String roleName) {
      /*  if (!dto.getRole().equalsIgnoreCase("STUDENT") && !dto.getRole().equalsIgnoreCase("TEACHER")) {
            return new ResponseEntity<>(new Message("No se permite crear usuarios ADMIN", null, TypesResponse.ERROR), HttpStatus.BAD_REQUEST);
        }*/
        if (repository.existsByEmail(dto.getEmail())) {
            return new ResponseEntity<>(new Message("Correo ya registrado", null, TypesResponse.WARNING), HttpStatus.BAD_REQUEST);
        }
        RoleEnum roleEnum = RoleEnum.valueOf(roleName);

        Optional<RoleEntity> role = roleRepository.findByRoleEnum(roleEnum);
        if (role.isEmpty() || !role.isPresent()) {
            return new ResponseEntity<>(new Message("Rol inválido", null, TypesResponse.ERROR), HttpStatus.BAD_REQUEST);
        }

        UserEntity user = new UserEntity();
        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setStatusActive(true);
        user.setRoles(role.get());

        user = repository.saveAndFlush(user);
        if (user == null) {
            log.info("El usuario no se registro ");
            return new ResponseEntity<>(new Message("El usuario no se registró", TypesResponse.ERROR), HttpStatus.BAD_REQUEST);
        }
        log.info("El Registro exitoso");

        return new ResponseEntity<>(new Message("Usuario creado", user, TypesResponse.SUCCESS), HttpStatus.OK);

    }

    public ResponseEntity<Message> findAll1() {
        return new ResponseEntity<>(new Message("Listado de usuarios", repository.findAll(), TypesResponse.SUCCESS), HttpStatus.OK);
    }

    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> updateUser1(Long id, UserDTO dto) {
        Optional<UserEntity> optionalUser = repository.findById(id);
        if (optionalUser.isEmpty()) {
            return new ResponseEntity<>(new Message("Usuario no encontrado", TypesResponse.WARNING), HttpStatus.NOT_FOUND);
        }

        UserEntity user = optionalUser.get();
        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        user = repository.saveAndFlush(user);

        log.info("Usuario con ID {} actualizado", id);

        return new ResponseEntity<>(new Message("Usuario actualizado correctamente", user, TypesResponse.SUCCESS), HttpStatus.OK);
    }

    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> logicalDeleteUser(Long id) {
        Optional<UserEntity> optionalUser = repository.findById(id);
        if (optionalUser.isEmpty()) {
            return new ResponseEntity<>(new Message("Usuario no encontrado", TypesResponse.WARNING), HttpStatus.NOT_FOUND);
        }
        UserEntity user = optionalUser.get();
        user.setStatusActive(!user.getStatusActive());
        repository.saveAndFlush(user);
        String estado = user.getStatusActive() ? "ACTIVADO" : "DESACTIVADO";

        log.info("Usuario con ID {} dado de baja (borrado lógico)", id);

        return new ResponseEntity<>(new Message("Usuario desactivado correctamente", TypesResponse.SUCCESS), HttpStatus.OK);
    }

    public ResponseEntity<Message> getUserProfileByEmail(String email) {
        Optional<UserEntity> optionalUser = repository.findByEmail(email);
        if (optionalUser.isPresent()) {
            UserEntity user = optionalUser.get();
            UserEntity clone = new UserEntity();
            clone.setId(user.getId());
            clone.setName(user.getName());
            clone.setLastName(user.getLastName());
            clone.setSurname(user.getSurname());
            clone.setEmail(user.getEmail());
            clone.setPhone(user.getPhone());
            clone.setStatusActive(user.getStatusActive());
            clone.setRoles(user.getRol());

            return ResponseEntity.ok(new Message("Perfil encontrado", clone, TypesResponse.SUCCESS));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new Message("Usuario no encontrado", null, TypesResponse.WARNING));
        }
    }

    @Transactional
    public ResponseEntity<Message> updatePassword1(String email, String newPassword) {
        Optional<UserEntity> optionalUser = repository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return new ResponseEntity<>(new Message("Usuario no encontrado", null, TypesResponse.WARNING), HttpStatus.NOT_FOUND);
        }

        UserEntity user = optionalUser.get();
        String hashed = passwordEncoder.encode(newPassword);
        user.setPassword(hashed);
        repository.save(user);


        return new ResponseEntity<>(new Message("Contraseña actualizada", null, TypesResponse.SUCCESS), HttpStatus.OK);
    }


    public ResponseEntity<Message> findByRol(String rol) {
        RoleEnum roleEnum = RoleEnum.valueOf(rol);

        Optional<RoleEntity> role = roleRepository.findByRoleEnum(roleEnum);
        if (role.isEmpty() || !role.isPresent()) {
            return new ResponseEntity<>(new Message("Rol inválido", null, TypesResponse.ERROR), HttpStatus.BAD_REQUEST);
        }

        List<UserEntity> userEntityList = repository.findAllByRole(role.get());
        return new ResponseEntity<>(new Message("Usuarios por rol encontrados", userEntityList, TypesResponse.SUCCESS), HttpStatus.OK);

    }

    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); // Este es el "sub" del token (correo)

        Optional<UserEntity> userOpt = repository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("Usuario no encontrado con email: " + email);
        }

        return userOpt.get().getId();
    }

    public String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No se encontró usuario autenticado");
        }

        String email = authentication.getName();
        UserEntity user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return user.getRol().getRoleEnum().name();
    }


    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> createDealer(UserDTO dto) {
        log.info("Creando Repartidor con email :  {}", dto.getEmail());

        if (repository.existsByEmail(dto.getEmail())) {
            log.info("repartidor  con email :  {} ya existe ", dto.getEmail());
            return new ResponseEntity<>(
                    new Message("Correo ya registrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        RoleEntity role = roleRepository.findByRoleEnum(RoleEnum.DEALER)
                .orElseThrow(() -> new RuntimeException("Rol REPARTIDOR no existe"));

        UserEntity user = new UserEntity();
        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setStatusActive(true);
        user.setRoles(role);

        user = repository.saveAndFlush(user);
        log.info(" Repartidor con email :  {} creado con exito ", dto.getEmail());


        return new ResponseEntity<>(
                new Message("Repartidor creado", user, TypesResponse.SUCCESS),
                HttpStatus.CREATED
        );
    }

    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> createAdmin(UserDTO dto) {

        log.info("==> [createAdmin] Entrando. Request para crear ADMIN con email: {}", dto.getEmail());

        if (repository.existsByEmail(dto.getEmail())) {
            log.info("==> [createAdmin] Validación fallida: correo ya registrado {}", dto.getEmail());
            return new ResponseEntity<>(
                    new Message("Correo ya registrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        RoleEntity role;
        try {
            role = roleRepository.findByRoleEnum(RoleEnum.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Rol ADMIN no existe"));
        } catch (Exception e) {
            log.error("==> [createAdmin] Error buscando rol ADMIN: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Message("Rol ADMIN no existe", null, TypesResponse.ERROR),
                    HttpStatus.BAD_REQUEST
            );
        }

        UserEntity user = new UserEntity();
        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setStatusActive(true);
        user.setRoles(role);

        user = repository.saveAndFlush(user);

        log.info("==> [createAdmin] ADMIN con email: {} creado con éxito. ID: {}", dto.getEmail(), user.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new Message("Admin creado", user, TypesResponse.SUCCESS));
    }

    public ResponseEntity<Message> findAll() {

        log.info("==> [findAll] Entrando. Solicitando listado completo de usuarios");

        List<UserEntity> users = repository.findAll();

        log.info("==> [findAll] Usuarios encontrados: {}", users.size());

        return ResponseEntity.ok(
                new Message("Usuarios encontrados", users, TypesResponse.SUCCESS)
        );
    }


    public ResponseEntity<Message> findAllDealers() {

        log.info("==> [findAllDealers] Entrando. Solicitando listado de DEALERS");

        RoleEntity role;
        try {
            role = roleRepository.findByRoleEnum(RoleEnum.DEALER)
                    .orElseThrow(() -> new RuntimeException("Rol DEALER no existe"));
        } catch (Exception e) {
            log.error("==> [findAllDealers] Error buscando rol DEALER: {}", e.getMessage());
            return new ResponseEntity<>(
                    new Message("Rol DEALER no existe", null, TypesResponse.ERROR),
                    HttpStatus.BAD_REQUEST
            );
        }

        List<UserEntity> list = repository.findAllByRole(role);

        log.info("==> [findAllDealers] DEALERS encontrados: {}", list.size());

        return ResponseEntity.ok(new Message("Dealers encontrados", list, TypesResponse.SUCCESS));
    }

    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> updateUser(Long id, UserDTO dto) {

        log.info("==> [updateUser] Entrando. Request para actualizar usuario ID: {}", id);

        Optional<UserEntity> opt = repository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [updateUser] Validación fallida: usuario no encontrado ID {}", id);
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        UserEntity user = opt.get();

        log.info("==> [updateUser] Usuario encontrado. Email previo: {}", user.getEmail());

        user.setName(dto.getName());
        user.setLastName(dto.getLastName());
        user.setSurname(dto.getSurname());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            log.info("==> [updateUser] Actualizando password para usuario ID {}", id);
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            log.info("==> [updateUser] Password no enviado / vacío, se mantiene el actual");
        }

        repository.save(user);

        log.info("==> [updateUser] Usuario ID {} actualizado con éxito. Nuevo email: {}", id, user.getEmail());

        return ResponseEntity.ok(new Message("Usuario actualizado", user, TypesResponse.SUCCESS));
    }

    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> toggleActive(Long id) {

        log.info("==> [toggleActive] Entrando. Request toggle active para usuario ID {}", id);

        if (id.equals(DataInitializer.ROOT_ADMIN_EMAIL)) {
            log.info("==> [toggleActive] Validación fallida: intento de desactivar ROOT ADMIN ID {}", id);
            return new ResponseEntity<>(
                    new Message("No se puede desactivar al administrador raíz", null, TypesResponse.ERROR),
                    HttpStatus.FORBIDDEN
            );
        }

        Optional<UserEntity> opt = repository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [toggleActive] Validación fallida: usuario no encontrado ID {}", id);
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        UserEntity user = opt.get();
        boolean newStatus = !user.getStatusActive();

        log.info("==> [toggleActive] Usuario encontrado email {}. Status actual: {} -> nuevo: {}",
                user.getEmail(), user.getStatusActive(), newStatus);

        user.setStatusActive(newStatus);
        repository.save(user);

        String estado = user.getStatusActive() ? "activado" : "desactivado";

        log.info("==> [toggleActive] Usuario ID {} {} con éxito", id, estado);

        return ResponseEntity.ok(new Message("Usuario " + estado, user, TypesResponse.SUCCESS));
    }


    public ResponseEntity<Message> getProfile(String email) {

        log.info("==> [getProfile] Entrando. Buscando perfil para email {}", email);

        Optional<UserEntity> opt = repository.findByEmail(email);
        if (opt.isEmpty()) {
            log.info("==> [getProfile] Validación fallida: usuario no encontrado email {}", email);
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        UserEntity user = opt.get();

        log.info("==> [getProfile] Perfil encontrado. Usuario ID {}", user.getId());

        return ResponseEntity.ok(
                new Message("Perfil encontrado", user, TypesResponse.SUCCESS)
        );
    }

    //Sin usar Plox
    @Transactional
    public ResponseEntity<Message> updatePassword(String email, String newPassword) {

        log.info("==> [updatePassword] Entrando. Request para cambiar password de email {}", email);

        Optional<UserEntity> opt = repository.findByEmail(email);
        if (opt.isEmpty()) {
            log.info("==> [updatePassword] Validación fallida: usuario no encontrado {}", email);
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        UserEntity user = opt.get();

        user.setPassword(passwordEncoder.encode(newPassword));
        repository.save(user);

        log.info("==> [updatePassword] Password actualizado con éxito para usuario ID {} email {}",
                user.getId(), email);

        return ResponseEntity.ok(
                new Message("Contraseña actualizada", null, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findOne(Long id) {

        log.info("==> [findOne] Buscando usuario por ID {}", id);

        Optional<UserEntity> opt = repository.findById(id);

        if (opt.isEmpty()) {
            log.info("==> [findOne] Usuario no encontrado ID {}", id);
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        UserEntity user = opt.get();

        log.info("==> [findOne] Usuario encontrado ID {} Email {}", id, user.getEmail());

        return ResponseEntity.ok(
                new Message("Usuario encontrado", user, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findOneById(Long id) {
        Optional<UserEntity> opt = repository.findById(id);

        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new Message("Usuario no encontrado", null, TypesResponse.WARNING));
        }

        return ResponseEntity.ok(
                new Message("Usuario encontrado", opt.get(), TypesResponse.SUCCESS));
    }

    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> saveFcmToken(String email, String fcmToken) {
        log.info("==> [saveFcmToken] Guardando token FCM para usuario {}", email);

        Optional<UserEntity> opt = repository.findByEmail(email);
        if (opt.isEmpty()) {
            log.error("==> [saveFcmToken] Usuario no encontrado: {}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new Message("Usuario no encontrado", null, TypesResponse.WARNING));
        }

        UserEntity user = opt.get();
        user.setFcmToken(fcmToken);
        repository.save(user);

        log.info("==> [saveFcmToken] Token FCM guardado exitosamente para usuario ID {}", user.getId());

        return ResponseEntity.ok(new Message("Token FCM guardado", null, TypesResponse.SUCCESS));
    }


}