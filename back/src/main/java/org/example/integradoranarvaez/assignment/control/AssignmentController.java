package org.example.integradoranarvaez.assignment.control;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.integradoranarvaez.assignment.model.AssignmentDTO;
import org.example.integradoranarvaez.assignment.model.AssignmentService;
import org.example.integradoranarvaez.utils.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    // =============== CREATE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/")
    public ResponseEntity<Message> create(@Valid @RequestBody AssignmentDTO dto) {

        log.info("==> [POST /api/assignments] Crear asignación dealer={} store={}",
                dto.getDealerId(), dto.getStoreId());

        ResponseEntity<Message> response = assignmentService.create(dto);

        log.info("<== [POST /api/assignments] Status {}", response.getStatusCode());
        return response;
    }

    // =============== UPDATE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Message> update(
            @PathVariable Long id,
            @Valid @RequestBody AssignmentDTO dto) {

        log.info("==> [PUT /api/assignments/{}] Actualizar asignación", id);

        ResponseEntity<Message> response = assignmentService.update(id, dto);

        log.info("<== [PUT /api/assignments/{}] Status {}", id, response.getStatusCode());
        return response;
    }

    // =============== TOGGLE ACTIVE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Message> toggleActive(@PathVariable Long id) {

        log.info("==> [PATCH /api/assignments/{}/toggle] Toggle asignación", id);

        ResponseEntity<Message> response = assignmentService.toggleActive(id);

        log.info("<== [PATCH /api/assignments/{}/toggle] Status {}", id, response.getStatusCode());
        return response;
    }

    // =============== FIND ONE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Message> getOne(@PathVariable Long id) {

        log.info("==> [GET /api/assignments/{}] Obtener asignación", id);

        ResponseEntity<Message> response = assignmentService.findOne(id);

        log.info("<== [GET /api/assignments/{}] Status {}", id, response.getStatusCode());
        return response;
    }

    // =============== LIST ALL (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/")
    public ResponseEntity<Message> getAll() {

        log.info("==> [GET /api/assignments] Listar todas las asignaciones");

        ResponseEntity<Message> response = assignmentService.findAll();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/assignments] Total asignaciones: {}", size);
        return response;
    }

    // =============== LIST ACTIVE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/active")
    public ResponseEntity<Message> getAllActive() {

        log.info("==> [GET /api/assignments/active] Listar asignaciones activas");

        ResponseEntity<Message> response = assignmentService.findAllActive();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/assignments/active] Total asignaciones activas: {}", size);
        return response;
    }

    // =============== LIST POR DEALER (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dealer/{dealerId}")
    public ResponseEntity<Message> getByDealer(@PathVariable Long dealerId) {

        log.info("==> [GET /api/assignments/dealer/{}] Listar asignaciones por dealer", dealerId);

        ResponseEntity<Message> response = assignmentService.findByDealer(dealerId);

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/assignments/dealer/{}] Total asignaciones: {}", dealerId, size);
        return response;
    }

    // =============== LIST POR STORE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/store/{storeId}")
    public ResponseEntity<Message> getByStore(@PathVariable Long storeId) {

        log.info("==> [GET /api/assignments/store/{}] Listar asignaciones por tienda", storeId);

        ResponseEntity<Message> response = assignmentService.findByStore(storeId);

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/assignments/store/{}] Total asignaciones: {}", storeId, size);
        return response;
    }

    // =============== LIST MIS ASIGNACIONES (DEALER) =============
    @PreAuthorize("hasRole('DEALER')")
    @GetMapping("/me")
    public ResponseEntity<Message> getMyAssignments() {

        log.info("==> [GET /api/assignments/me] Listar asignaciones del repartidor actual");

        ResponseEntity<Message> response = assignmentService.findMyAssignments();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/assignments/me] Total asignaciones activas: {}", size);
        return response;
    }

    // =============== FIND ONE FOR DEALER ==================
    @PreAuthorize("hasRole('DEALER')")
    @GetMapping("/me/{id}")
    public ResponseEntity<Message> getMyAssignmentById(@PathVariable Long id) {
        return assignmentService.findMyAssignmentById(id);
    }

}