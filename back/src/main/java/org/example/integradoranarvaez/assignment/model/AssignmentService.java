package org.example.integradoranarvaez.assignment.model;

import org.example.integradoranarvaez.assignment_type.AssignmentTypeEntity;
import org.example.integradoranarvaez.assignment_type.AssignmentTypeEnum;
import org.example.integradoranarvaez.assignment_type.AssignmentTypeRepository;
import org.example.integradoranarvaez.notification.model.NotificationService;
import org.example.integradoranarvaez.notification_type.NotificationTypeEnum;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.store.model.StoreRepository;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.example.integradoranarvaez.model.RoleEnum;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AssignmentService {

    private static final Logger log = LoggerFactory.getLogger(AssignmentService.class);

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final AssignmentTypeRepository assignmentTypeRepository;
    private final NotificationService notificationService;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             UserRepository userRepository,
                             StoreRepository storeRepository,
                             AssignmentTypeRepository assignmentTypeRepository,
                             NotificationService notificationService) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.assignmentTypeRepository = assignmentTypeRepository;
        this.notificationService = notificationService;
    }

    // =============== CREATE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> create(AssignmentDTO dto) {

        log.info("==> [AssignmentService.create] Crear asignación dealer={} store={} type={}",
                dto.getDealerId(), dto.getStoreId(), dto.getAssignmentType());

        Optional<UserEntity> optDealer = userRepository.findById(dto.getDealerId());
        if (optDealer.isEmpty()) {
            log.info("==> [AssignmentService.create] Repartidor no encontrado ID {}", dto.getDealerId());
            return new ResponseEntity<>(
                    new Message("Repartidor no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        Optional<StoreEntity> optStore = storeRepository.findById(dto.getStoreId());
        if (optStore.isEmpty()) {
            log.info("==> [AssignmentService.create] Tienda no encontrada ID {}", dto.getStoreId());
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        UserEntity dealer = optDealer.get();
        StoreEntity store = optStore.get();

        if (Boolean.FALSE.equals(store.getIsActive())) {
            log.info("==> [AssignmentService.create] Tienda ID {} está desactivada", store.getId());
            return new ResponseEntity<>(
                    new Message("No se puede asignar un repartidor a una tienda desactivada",
                            null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 2.2. Validar que el usuario tenga rol DEALER (por si las dudas)
        if (!"DEALER".equalsIgnoreCase(dealer.getRol().getRoleEnum().name())) {
            log.info("==> [AssignmentService.create] Usuario ID {} no es DEALER", dealer.getId());
            return new ResponseEntity<>(
                    new Message("Solo se pueden crear asignaciones para usuarios con rol DEALER",
                            null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 2.3. Validar que NO exista ya una asignación activa dealer+store
        if (assignmentRepository.existsByDealer_IdAndStore_IdAndIsActiveTrue(
                dto.getDealerId(), dto.getStoreId())) {

            log.info("==> [AssignmentService.create] Ya existe asignación activa dealer={} store={}",
                    dto.getDealerId(), dto.getStoreId());

            return new ResponseEntity<>(
                    new Message("Ya existe una asignación activa para este repartidor y esta tienda",
                            null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Validar tipo de asignación
        AssignmentTypeEnum typeEnum;
        try {
            typeEnum = AssignmentTypeEnum.valueOf(dto.getAssignmentType().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.info("==> [AssignmentService.create] Tipo de asignación inválido: {}", dto.getAssignmentType());
            return new ResponseEntity<>(
                    new Message("Tipo de asignación inválido", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        Optional<AssignmentTypeEntity> optType = assignmentTypeRepository.findByCode(typeEnum);
        if (optType.isEmpty()) {
            log.info("==> [AssignmentService.create] AssignmentType no encontrado para {}", typeEnum);
            return new ResponseEntity<>(
                    new Message("Tipo de asignación no configurado en catálogo", null, TypesResponse.ERROR),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        // Validaciones de negocio según RF-07 a RF-10
        // PERMANENT: frecuencia obligatoria, fechas opcionales
        if (typeEnum == AssignmentTypeEnum.PERMANENT) {
            if (dto.getFrequencyDays() == null || dto.getFrequencyDays() <= 0) {
                log.info("==> [AssignmentService.create] Frecuencia requerida para asignación permanente");
                return new ResponseEntity<>(
                        new Message("La frecuencia (en días) es obligatoria para asignaciones permanentes",
                                null, TypesResponse.WARNING),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // TEMPORARY: requiere al menos startDate, y si trae endDate que sea >= startDate
        if (typeEnum == AssignmentTypeEnum.TEMPORARY) {
            LocalDate start = dto.getStartDate();
            LocalDate end = dto.getEndDate();

            if (start == null) {
                log.info("==> [AssignmentService.create] startDate requerido para asignación temporal");
                return new ResponseEntity<>(
                        new Message("La fecha de inicio es obligatoria para asignaciones temporales",
                                null, TypesResponse.WARNING),
                        HttpStatus.BAD_REQUEST
                );
            }

            if (end != null && end.isBefore(start)) {
                log.info("==> [AssignmentService.create] Rango de fechas inválido (endDate < startDate)");
                return new ResponseEntity<>(
                        new Message("La fecha final no puede ser anterior a la inicial",
                                null, TypesResponse.WARNING),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        try {
            AssignmentEntity assignment = new AssignmentEntity();
            assignment.setDealer(optDealer.get());
            assignment.setStore(optStore.get());
            assignment.setAssignmentType(optType.get());
            assignment.setFrequencyDays(dto.getFrequencyDays());
            assignment.setStartDate(dto.getStartDate());
            assignment.setEndDate(dto.getEndDate());
            assignment.setIsActive(true);
            assignment.setCreatedAt(LocalDateTime.now());

            assignment = assignmentRepository.saveAndFlush(assignment);

            log.info("<== [AssignmentService.create] Asignación creada ID {}", assignment.getId());

            // Notificar al repartidor si la asignación es temporal
            AssignmentTypeEnum assignmentTypeCode = optType.get().getCode();
            if (assignmentTypeCode == AssignmentTypeEnum.TEMPORARY) {
                try {
                    String title = "Nueva asignación temporal";
                    String message = String.format("Te han asignado temporalmente a la tienda %s",
                            optStore.get().getName());
                    notificationService.createNotification(
                            optDealer.get().getId(),
                            NotificationTypeEnum.TEMP_ASSIGNMENT_CREATED,
                            title,
                            message,
                            assignment.getId()
                    );

                    // También notificar a los administradores
                    List<UserEntity> admins = userRepository.findAllByRole_RoleEnum(RoleEnum.ADMIN);
                    for (UserEntity admin : admins) {
                        String adminTitle = "Asignación temporal creada";
                        String adminMessage = String.format("Se ha creado una asignación temporal para el repartidor %s %s en la tienda %s",
                                optDealer.get().getName(),
                                optDealer.get().getLastName(),
                                optStore.get().getName());
                        notificationService.createNotification(
                                admin.getId(),
                                NotificationTypeEnum.TEMP_ASSIGNMENT_CREATED,
                                adminTitle,
                                adminMessage,
                                assignment.getId()
                        );
                    }

                    log.info("Notificaciones enviadas por asignación temporal ID: {}", assignment.getId());
                } catch (Exception e) {
                    log.error("Error al enviar notificaciones de asignación: {}", e.getMessage());
                    // No fallar la asignación si la notificación falla
                }
            } else {
                // Para asignaciones permanentes, solo notificar al repartidor
                try {
                    String title = "Nueva asignación permanente";
                    String message = String.format("Te han asignado permanentemente a la tienda %s",
                            optStore.get().getName());
                    notificationService.createNotification(
                            optDealer.get().getId(),
                            NotificationTypeEnum.TEMP_ASSIGNMENT_CREATED, // Usar el mismo tipo por ahora
                            title,
                            message,
                            assignment.getId()
                    );
                    log.info("Notificación enviada al repartidor por asignación permanente ID: {}", assignment.getId());
                } catch (Exception e) {
                    log.error("Error al enviar notificación de asignación permanente: {}", e.getMessage());
                }
            }

            return new ResponseEntity<>(
                    new Message("Asignación creada", assignment, TypesResponse.SUCCESS),
                    HttpStatus.CREATED
            );

        } catch (Exception e) {
            log.error("[AssignmentService.create] Error creando asignación: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    new Message("Error creando asignación", null, TypesResponse.ERROR),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============== UPDATE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> update(Long id, AssignmentDTO dto) {

        log.info("==> [AssignmentService.update] Actualizar asignación ID {}", id);

        Optional<AssignmentEntity> optAssignment = assignmentRepository.findById(id);
        if (optAssignment.isEmpty()) {
            log.info("==> [AssignmentService.update] Asignación no encontrada ID {}", id);
            return new ResponseEntity<>(
                    new Message("Asignación no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        Optional<UserEntity> optDealer = userRepository.findById(dto.getDealerId());
        if (optDealer.isEmpty()) {
            log.info("==> [AssignmentService.update] Repartidor no encontrado ID {}", dto.getDealerId());
            return new ResponseEntity<>(
                    new Message("Repartidor no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }


        Optional<StoreEntity> optStore = storeRepository.findById(dto.getStoreId());
        if (optStore.isEmpty()) {
            log.info("==> [AssignmentService.update] Tienda no encontrada ID {}", dto.getStoreId());
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        UserEntity dealer = optDealer.get();
        StoreEntity store = optStore.get();

        // 3.1. Tienda activa
        if (Boolean.FALSE.equals(store.getIsActive())) {
            log.info("==> [AssignmentService.update] Tienda ID {} está desactivada", store.getId());
            return new ResponseEntity<>(
                    new Message("No se puede asignar un repartidor a una tienda desactivada",
                            null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

// 3.2. Rol DEALER
        if (!"DEALER".equalsIgnoreCase(dealer.getRol().getRoleEnum().name())) {
            log.info("==> [AssignmentService.update] Usuario ID {} no es DEALER", dealer.getId());
            return new ResponseEntity<>(
                    new Message("Solo se pueden crear asignaciones para usuarios con rol DEALER",
                            null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

// 3.3. Duplicado (excluyendo la propia asignación)
        if (assignmentRepository.existsByDealer_IdAndStore_IdAndIsActiveTrueAndIdNot(
                dto.getDealerId(), dto.getStoreId(), id)) {

            log.info("==> [AssignmentService.update] Ya existe otra asignación activa dealer={} store={}",
                    dto.getDealerId(), dto.getStoreId());

            return new ResponseEntity<>(
                    new Message("Ya existe otra asignación activa para este repartidor y esta tienda",
                            null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        AssignmentTypeEnum typeEnum;
        try {
            typeEnum = AssignmentTypeEnum.valueOf(dto.getAssignmentType().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.info("==> [AssignmentService.update] Tipo de asignación inválido: {}", dto.getAssignmentType());
            return new ResponseEntity<>(
                    new Message("Tipo de asignación inválido", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        Optional<AssignmentTypeEntity> optType = assignmentTypeRepository.findByCode(typeEnum);
        if (optType.isEmpty()) {
            log.info("==> [AssignmentService.update] AssignmentType no encontrado para {}", typeEnum);
            return new ResponseEntity<>(
                    new Message("Tipo de asignación no configurado en catálogo", null, TypesResponse.ERROR),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        // Validaciones igual que en create
        if (typeEnum == AssignmentTypeEnum.PERMANENT) {
            if (dto.getFrequencyDays() == null || dto.getFrequencyDays() <= 0) {
                log.info("==> [AssignmentService.update] Frecuencia requerida para permanente");
                return new ResponseEntity<>(
                        new Message("La frecuencia (en días) es obligatoria para asignaciones permanentes",
                                null, TypesResponse.WARNING),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        if (typeEnum == AssignmentTypeEnum.TEMPORARY) {
            LocalDate start = dto.getStartDate();
            LocalDate end = dto.getEndDate();

            if (start == null) {
                log.info("==> [AssignmentService.update] startDate requerido para temporal");
                return new ResponseEntity<>(
                        new Message("La fecha de inicio es obligatoria para asignaciones temporales",
                                null, TypesResponse.WARNING),
                        HttpStatus.BAD_REQUEST
                );
            }

            if (end != null && end.isBefore(start)) {
                log.info("==> [AssignmentService.update] Rango de fechas inválido (endDate < startDate)");
                return new ResponseEntity<>(
                        new Message("La fecha final no puede ser anterior a la inicial",
                                null, TypesResponse.WARNING),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        try {
            AssignmentEntity assignment = optAssignment.get();
            assignment.setDealer(optDealer.get());
            assignment.setStore(optStore.get());
            assignment.setAssignmentType(optType.get());
            assignment.setFrequencyDays(dto.getFrequencyDays());
            assignment.setStartDate(dto.getStartDate());
            assignment.setEndDate(dto.getEndDate());

            if (dto.getIsActive() != null) {
                assignment.setIsActive(dto.getIsActive());
            }

            assignmentRepository.saveAndFlush(assignment);

            log.info("<== [AssignmentService.update] Asignación ID {} actualizada", id);

            return ResponseEntity.ok(
                    new Message("Asignación actualizada", assignment, TypesResponse.SUCCESS)
            );

        } catch (Exception e) {
            log.error("[AssignmentService.update] Error actualizando asignación: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    new Message("Error actualizando asignación", null, TypesResponse.ERROR),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============== TOGGLE ACTIVE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> toggleActive(Long id) {

        log.info("==> [AssignmentService.toggleActive] Toggle asignación ID {}", id);

        Optional<AssignmentEntity> opt = assignmentRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [AssignmentService.toggleActive] Asignación no encontrada ID {}", id);
            return new ResponseEntity<>(
                    new Message("Asignación no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        AssignmentEntity assignment = opt.get();
        boolean newStatus = !assignment.getIsActive();
        assignment.setIsActive(newStatus);
        assignmentRepository.saveAndFlush(assignment);

        String estado = newStatus ? "activada" : "desactivada";
        log.info("<== [AssignmentService.toggleActive] Asignación ID {} {}", id, estado);

        return ResponseEntity.ok(
                new Message("Asignación " + estado, assignment, TypesResponse.SUCCESS)
        );
    }

    // =============== FIND ONE ==================
    public ResponseEntity<Message> findOne(Long id) {

        log.info("==> [AssignmentService.findOne] Buscar asignación ID {}", id);

        Optional<AssignmentEntity> opt = assignmentRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("<== [AssignmentService.findOne] Asignación no encontrada ID {}", id);
            return new ResponseEntity<>(
                    new Message("Asignación no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        AssignmentEntity assignment = opt.get();

        log.info("<== [AssignmentService.findOne] Asignación encontrada ID {}", id);

        return ResponseEntity.ok(
                new Message("Asignación encontrada", assignment, TypesResponse.SUCCESS)
        );
    }

    // =============== LIST ==================
    public ResponseEntity<Message> findAll() {

        log.info("==> [AssignmentService.findAll] Listar todas las asignaciones");

        List<AssignmentEntity> list = assignmentRepository.findAll();

        log.info("<== [AssignmentService.findAll] Total asignaciones: {}", list.size());

        return ResponseEntity.ok(
                new Message("Listado de asignaciones", list, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findAllActive() {

        log.info("==> [AssignmentService.findAllActive] Listar asignaciones activas");

        List<AssignmentEntity> list = assignmentRepository.findAllByIsActiveTrue();

        log.info("<== [AssignmentService.findAllActive] Total asignaciones activas: {}", list.size());

        return ResponseEntity.ok(
                new Message("Listado de asignaciones activas", list, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findByDealer(Long dealerId) {

        log.info("==> [AssignmentService.findByDealer] Listar asignaciones para dealer {}", dealerId);

        List<AssignmentEntity> list = assignmentRepository.findAllByDealer_IdAndIsActiveTrueAndStore_IsActiveTrue(dealerId);

        log.info("<== [AssignmentService.findByDealer] Total asignaciones activas dealer {}: {}", dealerId, list.size());

        return ResponseEntity.ok(
                new Message("Asignaciones por repartidor", list, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findMyAssignments() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("==> [AssignmentService.findMyAssignments] Listar asignaciones para usuario {}", email);

        Optional<UserEntity> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            log.info("==> [AssignmentService.findMyAssignments] Usuario no encontrado {}", email);
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        Long dealerId = optUser.get().getId();
        List<AssignmentEntity> list = assignmentRepository.findAllByDealer_IdAndIsActiveTrueAndStore_IsActiveTrue(dealerId);

        log.info("<== [AssignmentService.findMyAssignments] Total asignaciones activas: {}", list.size());

        return ResponseEntity.ok(
                new Message("Asignaciones del repartidor", list, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findByStore(Long storeId) {

        log.info("==> [AssignmentService.findByStore] Listar asignaciones para tienda {}", storeId);

        List<AssignmentEntity> list = assignmentRepository.findAllByStore_IdAndIsActiveTrue(storeId);

        log.info("<== [AssignmentService.findByStore] Total asignaciones activas tienda {}: {}", storeId, list.size());

        return ResponseEntity.ok(
                new Message("Asignaciones por tienda", list, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findMyAssignmentById(Long id) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Optional<UserEntity> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Usuario no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        Long dealerId = optUser.get().getId();

        Optional<AssignmentEntity> optAssignment = assignmentRepository.findById(id);

        if (optAssignment.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Asignación no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        AssignmentEntity assignment = optAssignment.get();

        // Validar que la asignación pertenece al dealer
        if (!assignment.getDealer().getId().equals(dealerId)) {
            return new ResponseEntity<>(
                    new Message("No tienes permiso para ver esta asignación", null, TypesResponse.WARNING),
                    HttpStatus.FORBIDDEN
            );
        }

        return ResponseEntity.ok(
                new Message("Asignación encontrada", assignment, TypesResponse.SUCCESS)
        );
    }

}