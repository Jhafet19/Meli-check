package org.example.integradoranarvaez.visit.model;

import org.example.integradoranarvaez.assignment.model.AssignmentEntity;
import org.example.integradoranarvaez.assignment.model.AssignmentRepository;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.store.model.StoreRepository;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.example.integradoranarvaez.user.model.UserService;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.example.integradoranarvaez.visit_status.VisitStatusEntity;
import org.example.integradoranarvaez.visit_status.VisitStatusEnum;
import org.example.integradoranarvaez.visit_status.VisitStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class VisitService {

    private static final Logger log = LoggerFactory.getLogger(VisitService.class);

    private final VisitRepository visitRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final VisitStatusRepository visitStatusRepository;
    private final AssignmentRepository assignmentRepository;

    public VisitService(VisitRepository visitRepository,
                        StoreRepository storeRepository,
                        UserRepository userRepository,
                        UserService userService,
                        VisitStatusRepository visitStatusRepository,
                        AssignmentRepository assignmentRepository) {
        this.visitRepository = visitRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.visitStatusRepository = visitStatusRepository;
        this.assignmentRepository = assignmentRepository;
    }

    // =============== CHECK-IN POR QR ==================
    @Transactional
    public ResponseEntity<Message> checkInByQr(String qrCode, Double latitude, Double longitude) {

        // Obtener el dealer actual desde el contexto de seguridad
        Long dealerId = userService.getCurrentUserId();
        String currentRole = userService.getCurrentUserRole();

        if (!"DEALER".equals(currentRole)) {
            throw new AccessDeniedException("Solo los dealers pueden hacer check-in");
        }

        log.info("==> [VisitService.checkInByQr] Check-in con QR: {}, Dealer: {}", qrCode, dealerId);

        // 1. Obtener la tienda por QR
        Optional<StoreEntity> storeOpt = storeRepository.findByQrCode(qrCode);

        if (storeOpt.isEmpty()) {
            log.info("==> [VisitService.checkInByQr] Tienda no encontrada con QR: {}", qrCode);
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }
        StoreEntity store = storeOpt.get();

        // 2. Validar que la tienda esté activa
        if (!store.getIsActive()) {
            log.info("==> [VisitService.checkInByQr] Tienda inactiva: {}", store.getId());
            return new ResponseEntity<>(
                    new Message("Tienda inactiva", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 3. Validar que el dealer exista
        Optional<UserEntity> dealerOpt = userRepository.findById(dealerId);

        if (dealerOpt.isEmpty()) {
            log.info("==> [VisitService.checkInByQr] Dealer no encontrado: {}", dealerId);
            return new ResponseEntity<>(
                    new Message("Dealer no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }
        UserEntity dealer = dealerOpt.get();

        // 4. Validar que el dealer esté activo
        if (!dealer.getStatusActive()) {
            log.info("==> [VisitService.checkInByQr] Dealer inactivo: {}", dealerId);
            return new ResponseEntity<>(
                    new Message("Dealer inactivo", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 5. Validar asignación activa para hoy
        LocalDate today = LocalDate.now();
        Optional<AssignmentEntity> validAssignment = findValidAssignmentForToday(dealerId, store.getId(), today);

        if (validAssignment.isEmpty()) {
            log.info("==> [VisitService.checkInByQr] No tiene asignación válida para esta tienda hoy");
            return new ResponseEntity<>(
                    new Message("No tiene una asignación válida para esta tienda hoy", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 6. Validar que no haya otra visita abierta
        boolean hasOpenVisit = visitRepository.existsOpenVisit(dealerId, store.getId());
        if (hasOpenVisit) {
            log.info("==> [VisitService.checkInByQr] Ya existe una visita abierta para esta tienda");
            return new ResponseEntity<>(
                    new Message("Ya tiene una visita en curso para esta tienda", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 7. Buscar visita PLANNED para hoy o crear una nueva
        VisitEntity visit = null;

        Optional<VisitEntity> plannedVisitOpt = visitRepository
                .findPlannedVisitByQrAndDealer(qrCode, dealerId);

        if (plannedVisitOpt.isPresent()) {
            visit = plannedVisitOpt.get();
            log.info("==> [VisitService.checkInByQr] Visita planificada encontrada: {}", visit.getId());
        } else {
            // Crear nueva visita
            visit = new VisitEntity();
            visit.setDealer(dealer);
            visit.setStore(store);
            visit.setVisitDate(today);
            visit.setScheduledDate(today);
            visit.setOrigin(VisitOrigin.OFFLINE);
            visit.setAssignment(validAssignment.get());
            visit.setIsActive(true);
            visit.setCreatedAt(LocalDateTime.now());

            // Estado inicial: PLANNED
            VisitStatusEntity plannedStatus = visitStatusRepository.findByCode(VisitStatusEnum.PLANNED)
                    .orElseThrow(() -> new RuntimeException("Estado PLANNED no encontrado"));
            visit.setStatus(plannedStatus);

            visit = visitRepository.save(visit);
            log.info("==> [VisitService.checkInByQr] Nueva visita creada: {}", visit.getId());
        }

        // 8. Actualizar a CHECKED_IN
        VisitStatusEntity checkedInStatus = visitStatusRepository.findByCode(VisitStatusEnum.CHECKED_IN)
                .orElseThrow(() -> new RuntimeException("Estado CHECKED_IN no encontrado"));

        visit.setStatus(checkedInStatus);
        visit.setCheckInAt(LocalDateTime.now());
        visit.setCheckinLat(latitude);
        visit.setCheckinLng(longitude);
        visit.setUpdatedAt(LocalDateTime.now());

        visit = visitRepository.save(visit);

        log.info("<== [VisitService.checkInByQr] Check-in realizado. Visita ID: {}", visit.getId());

        return ResponseEntity.ok(
                new Message("Check-in realizado exitosamente", visit, TypesResponse.SUCCESS)
        );
    }

    // Método auxiliar para encontrar asignación válida para hoy
    private Optional<AssignmentEntity> findValidAssignmentForToday(Long dealerId, Long storeId, LocalDate today) {
        // Buscar todas las asignaciones activas para este dealer y tienda
        List<AssignmentEntity> assignments = assignmentRepository
                .findAllByDealer_IdAndStore_IdAndIsActiveTrue(dealerId, storeId);

        for (AssignmentEntity assignment : assignments) {
            if (isAssignmentValidForDate(assignment, today)) {
                return Optional.of(assignment);
            }
        }

        return Optional.empty();
    }

    private boolean isAssignmentValidForDate(AssignmentEntity assignment, LocalDate date) {
        String assignmentType = assignment.getAssignmentType().getCode().name();

        if ("PERMANENT".equals(assignmentType)) {
            // Para asignaciones permanentes, validar por frecuencia
            Integer frequencyDays = assignment.getFrequencyDays();
            if (frequencyDays == null || frequencyDays <= 0) {
                return false;
            }

            // Si hay startDate, la fecha debe ser >= startDate
            if (assignment.getStartDate() != null && date.isBefore(assignment.getStartDate())) {
                return false;
            }

            // Si hay endDate, la fecha debe ser <= endDate
            if (assignment.getEndDate() != null && date.isAfter(assignment.getEndDate())) {
                return false;
            }

            // Calcular si hoy corresponde según la frecuencia
            LocalDate startDate = assignment.getStartDate() != null ? assignment.getStartDate() : assignment.getCreatedAt().toLocalDate();
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, date);

            return daysBetween % frequencyDays == 0;

        } else if ("TEMPORARY".equals(assignmentType)) {
            // Para asignaciones temporales, validar rango de fechas
            LocalDate startDate = assignment.getStartDate();
            LocalDate endDate = assignment.getEndDate();

            if (startDate == null) {
                return false;
            }

            // La fecha debe ser >= startDate
            if (date.isBefore(startDate)) {
                return false;
            }

            // Si hay endDate, la fecha debe ser <= endDate
            if (endDate != null && date.isAfter(endDate)) {
                return false;
            }

            return true;
        }

        return false;
    }

    // =============== COMPLETAR VISITA ==================
    @Transactional
    public ResponseEntity<Message> completeVisit(Long visitId, Double latitude, Double longitude, String notes) {

        log.info("==> [VisitService.completeVisit] Completar visita ID: {}", visitId);

        // Validar que el dealer sea el dueño de la visita
        Long currentDealerId = userService.getCurrentUserId();

        Optional<VisitEntity> visitOpt = visitRepository.findById(visitId);

        if (visitOpt.isEmpty()) {
            log.info("==> [VisitService.completeVisit] Visita no encontrada: {}", visitId);
            return new ResponseEntity<>(
                    new Message("Visita no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }
        VisitEntity visit = visitOpt.get();

        // Verificar que el dealer sea el dueño de la visita
        if (!visit.getDealer().getId().equals(currentDealerId)) {
            throw new AccessDeniedException("No tiene permisos para completar esta visita");
        }

        // Validar transición de estado
        if (visit.getStatus().getCode() != VisitStatusEnum.CHECKED_IN) {
            log.info("==> [VisitService.completeVisit] Visita no está en estado CHECKED_IN");
            return new ResponseEntity<>(
                    new Message("La visita no está en estado de check-in", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Actualizar a COMPLETED
        VisitStatusEntity completedStatus = visitStatusRepository.findByCode(VisitStatusEnum.COMPLETED)
                .orElseThrow(() -> new RuntimeException("Estado COMPLETED no encontrado"));

        visit.setStatus(completedStatus);
        visit.setCheckOutAt(LocalDateTime.now());
        visit.setCheckoutLat(latitude);
        visit.setCheckoutLng(longitude);
        visit.setUpdatedAt(LocalDateTime.now());

        if (notes != null && !notes.trim().isEmpty()) {
            visit.setNotes(notes);
        }

        visit = visitRepository.save(visit);

        log.info("<== [VisitService.completeVisit] Visita completada ID: {}", visitId);

        return ResponseEntity.ok(
                new Message("Visita completada exitosamente", visit, TypesResponse.SUCCESS)
        );
    }

    // =============== SKIP VISITA ==================
    @Transactional
    public ResponseEntity<Message> skipVisit(Long visitId, String reason) {

        log.info("==> [VisitService.skipVisit] Saltar visita ID: {}", visitId);

        // Validar que el dealer sea el dueño de la visita
        Long currentDealerId = userService.getCurrentUserId();

        Optional<VisitEntity> visitOpt = visitRepository.findById(visitId);

        if (visitOpt.isEmpty()) {
            log.info("==> [VisitService.skipVisit] Visita no encontrada: {}", visitId);
            return new ResponseEntity<>(
                    new Message("Visita no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }
        VisitEntity visit = visitOpt.get();

        // Verificar que el dealer sea el dueño de la visita
        if (!visit.getDealer().getId().equals(currentDealerId)) {
            throw new AccessDeniedException("No tiene permisos para saltar esta visita");
        }

        // Validar transición de estado (solo desde PLANNED)
        if (visit.getStatus().getCode() != VisitStatusEnum.PLANNED) {
            log.info("==> [VisitService.skipVisit] Visita no está en estado PLANNED");
            return new ResponseEntity<>(
                    new Message("Solo se pueden saltar visitas planificadas", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // Actualizar a SKIPPED
        VisitStatusEntity skippedStatus = visitStatusRepository.findByCode(VisitStatusEnum.SKIPPED)
                .orElseThrow(() -> new RuntimeException("Estado SKIPPED no encontrado"));

        visit.setStatus(skippedStatus);
        visit.setUpdatedAt(LocalDateTime.now());

        if (reason != null && !reason.trim().isEmpty()) {
            String currentNotes = visit.getNotes() != null ? visit.getNotes() + "\n" : "";
            visit.setNotes(currentNotes + "Motivo de salto: " + reason);
        }

        visit = visitRepository.save(visit);

        log.info("<== [VisitService.skipVisit] Visita saltada ID: {}", visitId);

        return ResponseEntity.ok(
                new Message("Visita marcada como saltada", visit, TypesResponse.SUCCESS)
        );
    }

    // =============== LISTAR VISITAS DE HOY POR DEALER ==================
    public ResponseEntity<Message> getTodayVisitsByDealer() {

        Long dealerId = userService.getCurrentUserId();
        LocalDate today = LocalDate.now();

        log.info("==> [VisitService.getTodayVisitsByDealer] Dealer: {}, Fecha: {}", dealerId, today);

        List<VisitEntity> visits = visitRepository.findAllByDealer_IdAndVisitDate(dealerId, today);

        log.info("<== [VisitService.getTodayVisitsByDealer] Total visitas: {}", visits.size());

        return ResponseEntity.ok(
                new Message("Visitas de hoy encontradas", visits, TypesResponse.SUCCESS)
        );
    }

    // =============== LISTAR VISITAS POR DEALER Y FECHA ==================
    public ResponseEntity<Message> getVisitsByDealerAndDate(Long dealerId, LocalDate date) {

        log.info("==> [VisitService.getVisitsByDealerAndDate] Dealer: {}, Fecha: {}", dealerId, date);

        List<VisitEntity> visits = visitRepository.findAllByDealer_IdAndVisitDate(dealerId, date);

        log.info("<== [VisitService.getVisitsByDealerAndDate] Total visitas: {}", visits.size());

        return ResponseEntity.ok(
                new Message("Visitas encontradas", visits, TypesResponse.SUCCESS)
        );
    }

    // =============== LISTAR VISITAS POR DEALER (para admin) ==================
    public ResponseEntity<Message> getVisitsByDealer(Long dealerId) {

        log.info("==> [VisitService.getVisitsByDealer] Dealer: {}", dealerId);

        List<VisitEntity> visits = visitRepository.findAllByDealer_Id(dealerId);

        log.info("<== [VisitService.getVisitsByDealer] Total visitas: {}", visits.size());

        return ResponseEntity.ok(
                new Message("Visitas del dealer encontradas", visits, TypesResponse.SUCCESS)
        );
    }

    // =============== LISTAR VISITAS ABIERTAS (en curso) ==================
    public ResponseEntity<Message> getOpenVisits() {

        Long dealerId = userService.getCurrentUserId();

        log.info("==> [VisitService.getOpenVisits] Dealer: {}", dealerId);

        List<VisitEntity> visits = visitRepository.findOpenVisitsByDealer(dealerId);

        log.info("<== [VisitService.getOpenVisits] Total visitas abiertas: {}", visits.size());

        return ResponseEntity.ok(
                new Message("Visitas abiertas encontradas", visits, TypesResponse.SUCCESS)
        );
    }

    // =============== FILTRAR VISITAS (ADMIN) ==================
    public ResponseEntity<Message> filterVisits(Long dealerId, Long storeId, VisitStatusEnum status,
                                                LocalDate startDate, LocalDate endDate) {

        log.info("==> [VisitService.filterVisits] Filtros - Dealer: {}, Tienda: {}, Status: {}",
                dealerId, storeId, status);

        List<VisitEntity> visits = visitRepository.findByFilters(dealerId, storeId, status, startDate, endDate);

        log.info("<== [VisitService.filterVisits] Total visitas filtradas: {}", visits.size());

        return ResponseEntity.ok(
                new Message("Visitas filtradas", visits, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> getVisitById(Long id) {

        log.info("==> [VisitService.getVisitById] ID: {}", id);

        Optional<VisitEntity> visitOpt = visitRepository.findById(id);

        if (visitOpt.isEmpty()) {
            log.info("<== [VisitService.getVisitById] Visita no encontrada: {}", id);
            return new ResponseEntity<>(
                    new Message("Visita no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }
        VisitEntity visit = visitOpt.get();

        log.info("<== [VisitService.getVisitById] Visita encontrada: {}", id);

        return ResponseEntity.ok(
                new Message("Visita encontrada", visit, TypesResponse.SUCCESS)
        );
    }

    // =============== OBTENER VISITA POR STORE Y FECHA ==================
    public ResponseEntity<Message> getVisitsByStoreAndDate(Long storeId, LocalDate date) {

        log.info("==> [VisitService.getVisitsByStoreAndDate] Tienda: {}, Fecha: {}", storeId, date);

        List<VisitEntity> visits = visitRepository.findAllByStore_IdAndVisitDate(storeId, date);

        log.info("<== [VisitService.getVisitsByStoreAndDate] Total visitas: {}", visits.size());

        return ResponseEntity.ok(
                new Message("Visitas de la tienda encontradas", visits, TypesResponse.SUCCESS)
        );
    }

    // =============== CREAR VISITA MANUAL (ADMIN) ==================
    @Transactional
    public ResponseEntity<Message> createManualVisit(VisitDTO dto) {

        log.info("==> [VisitService.createManualVisit] Crear visita manual para dealer: {}, tienda: {}",
                dto.getDealerId(), dto.getStoreId());

        // Validar dealer
        Optional<UserEntity> dealerOpt = userRepository.findById(dto.getDealerId());
        if (dealerOpt.isEmpty()) {
            log.info("==> [VisitService.createManualVisit] Dealer no encontrado: {}", dto.getDealerId());
            return new ResponseEntity<>(
                    new Message("Dealer no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        // Validar tienda
        Optional<StoreEntity> storeOpt = storeRepository.findById(dto.getStoreId());
        if (storeOpt.isEmpty()) {
            log.info("==> [VisitService.createManualVisit] Tienda no encontrada: {}", dto.getStoreId());
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        // Validar estado
        Optional<VisitStatusEntity> statusOpt = visitStatusRepository.findById(dto.getStatusId());
        if (statusOpt.isEmpty()) {
            log.info("==> [VisitService.createManualVisit] Estado no encontrado: {}", dto.getStatusId());
            return new ResponseEntity<>(
                    new Message("Estado de visita no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        VisitEntity visit = new VisitEntity();
        visit.setDealer(dealerOpt.get());
        visit.setStore(storeOpt.get());
        visit.setStatus(statusOpt.get());
        visit.setVisitDate(dto.getVisitDate() != null ? dto.getVisitDate() : LocalDate.now());
        visit.setScheduledDate(dto.getScheduledDate());
        visit.setCheckInAt(dto.getCheckInAt());
        visit.setCheckOutAt(dto.getCheckOutAt());
        visit.setCheckinLat(dto.getCheckinLat());
        visit.setCheckinLng(dto.getCheckinLng());
        visit.setCheckoutLat(dto.getCheckoutLat());
        visit.setCheckoutLng(dto.getCheckoutLng());
        visit.setNotes(dto.getNotes());
        visit.setOrigin(dto.getOrigin() != null ? dto.getOrigin() : VisitOrigin.OFFLINE);
        visit.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        visit.setCreatedAt(LocalDateTime.now());

        // Si viene assignmentId, asignarlo
        if (dto.getAssignmentId() != null) {
            Optional<AssignmentEntity> assignmentOpt = assignmentRepository.findById(dto.getAssignmentId());
            assignmentOpt.ifPresent(visit::setAssignment);
        }

        visit = visitRepository.save(visit);

        log.info("<== [VisitService.createManualVisit] Visita creada ID: {}", visit.getId());

        return ResponseEntity.ok(
                new Message("Visita creada exitosamente", visit, TypesResponse.SUCCESS)
        );
    }

    // =============== ACTUALIZAR VISITA (ADMIN) ==================
    @Transactional
    public ResponseEntity<Message> updateVisit(Long id, VisitDTO dto) {

        log.info("==> [VisitService.updateVisit] Actualizar visita ID: {}", id);

        Optional<VisitEntity> visitOpt = visitRepository.findById(id);
        if (visitOpt.isEmpty()) {
            log.info("==> [VisitService.updateVisit] Visita no encontrada: {}", id);
            return new ResponseEntity<>(
                    new Message("Visita no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        VisitEntity visit = visitOpt.get();

        // Actualizar campos permitidos
        if (dto.getVisitDate() != null) {
            visit.setVisitDate(dto.getVisitDate());
        }

        if (dto.getScheduledDate() != null) {
            visit.setScheduledDate(dto.getScheduledDate());
        }

        if (dto.getCheckInAt() != null) {
            visit.setCheckInAt(dto.getCheckInAt());
        }

        if (dto.getCheckOutAt() != null) {
            visit.setCheckOutAt(dto.getCheckOutAt());
        }

        if (dto.getCheckinLat() != null) {
            visit.setCheckinLat(dto.getCheckinLat());
        }

        if (dto.getCheckinLng() != null) {
            visit.setCheckinLng(dto.getCheckinLng());
        }

        if (dto.getCheckoutLat() != null) {
            visit.setCheckoutLat(dto.getCheckoutLat());
        }

        if (dto.getCheckoutLng() != null) {
            visit.setCheckoutLng(dto.getCheckoutLng());
        }

        if (dto.getNotes() != null) {
            visit.setNotes(dto.getNotes());
        }

        if (dto.getIsActive() != null) {
            visit.setIsActive(dto.getIsActive());
        }

        if (dto.getStatusId() != null) {
            Optional<VisitStatusEntity> statusOpt = visitStatusRepository.findById(dto.getStatusId());
            if (statusOpt.isPresent()) {
                visit.setStatus(statusOpt.get());
            }
        }

        visit.setUpdatedAt(LocalDateTime.now());
        visit = visitRepository.save(visit);

        log.info("<== [VisitService.updateVisit] Visita actualizada ID: {}", id);

        return ResponseEntity.ok(
                new Message("Visita actualizada exitosamente", visit, TypesResponse.SUCCESS)
        );
    }
}