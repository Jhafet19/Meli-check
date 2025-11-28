package org.example.integradoranarvaez.store.control;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

import org.example.integradoranarvaez.store.model.StoreDTO;
import org.example.integradoranarvaez.store.model.StoreService;
import org.example.integradoranarvaez.utils.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.store.model.StoreRepository;
import org.example.integradoranarvaez.utils.QrCodeService;
import com.google.zxing.WriterException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "*")
public class StoreController {

    private final StoreService storeService;
    private final StoreRepository storeRepository;   // NUEVO
    private final QrCodeService qrCodeService;

    public StoreController(StoreService storeService, StoreRepository storeRepository, QrCodeService qrCodeService) {
        this.storeService = storeService;
        this.storeRepository = storeRepository;
        this.qrCodeService = qrCodeService;
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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getStoreQr(@PathVariable Long id) {

        log.info("==> [GET /api/stores/{}/qr] Generar QR de tienda", id);

        StoreEntity store = storeRepository.findById(id).orElse(null);
        if (store == null) {
            log.info("<== [GET /api/stores/{}/qr] Tienda no encontrada", id);
            return ResponseEntity.notFound().build();
        }

        String qrText = store.getQrCode(); // el token que ya generas en StoreService

        try {
            byte[] imageBytes = qrCodeService.generateQrPng(qrText, 300, 300);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            // inline para mostrarlo en navegador, attachment si quieres forzar descarga
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"store-" + id + "-qr.png\"");

            log.info("<== [GET /api/stores/{}/qr] QR generado OK", id);

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(imageBytes);

        } catch (WriterException | IOException e) {
            log.error("[GET /api/stores/{}/qr] Error generando QR: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}