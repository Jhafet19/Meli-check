package org.example.integradoranarvaez.store.control;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

import org.example.integradoranarvaez.store.model.StoreDTO;
import org.example.integradoranarvaez.store.model.StoreService;
import org.example.integradoranarvaez.utils.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "*")
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    // =============== CREATE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/")
    public ResponseEntity<Message> create(@Valid @RequestBody StoreDTO dto) {

        log.info("==> [POST /api/stores] Crear tienda {}", dto.getName());

        ResponseEntity<Message> response = storeService.create(dto);

        log.info("<== [POST /api/stores] Status {}", response.getStatusCode());

        return response;
    }

    // =============== UPDATE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Message> update(
            @PathVariable Long id,
            @Valid @RequestBody StoreDTO dto) {

        log.info("==> [PUT /api/stores/{}] Actualizar tienda", id);

        ResponseEntity<Message> response = storeService.update(id, dto);

        log.info("<== [PUT /api/stores/{}] Status {}", id, response.getStatusCode());

        return response;
    }

    // =============== TOGGLE ACTIVE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Message> toggleActive(@PathVariable Long id) {

        log.info("==> [PATCH /api/stores/{}/toggle] Toggle tienda", id);

        ResponseEntity<Message> response = storeService.toggleActive(id);

        log.info("<== [PATCH /api/stores/{}/toggle] Status {}", id, response.getStatusCode());

        return response;
    }

    // =============== LIST (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/")
    public ResponseEntity<Message> getAll() {

        log.info("==> [GET /api/stores] Listar todas las tiendas");

        ResponseEntity<Message> response = storeService.findAll();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/stores] Total tiendas: {}", size);

        return response;
    }

    // =============== LIST ACTIVAS (ADMIN + DEALER) ==================
    @PreAuthorize("hasAnyRole('ADMIN','DEALER')")
    @GetMapping("/active")
    public ResponseEntity<Message> getAllActive() {

        log.info("==> [GET /api/stores/active] Listar tiendas activas");

        ResponseEntity<Message> response = storeService.findAllActive();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/stores/active] Total tiendas activas: {}", size);

        return response;
    }

    @PreAuthorize("hasAnyRole('ADMIN','DEALER')")
    @GetMapping("/{id}")
    public ResponseEntity<Message> getOne(@PathVariable Long id) {

        log.info("==> [GET /api/stores/{}] Obtener tienda por ID", id);

        ResponseEntity<Message> response = storeService.findOne(id);

        log.info("<== [GET /api/stores/{}] Status {}", id, response.getStatusCode());

        return response;
    }
}