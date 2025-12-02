package org.example.integradoranarvaez.visit.control;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.example.integradoranarvaez.visit.model.*;
import org.example.integradoranarvaez.visit_status.VisitStatusEnum;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/visits")
@CrossOrigin(origins = "*")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    // =============== CHECK-IN POR QR (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PostMapping("/check-in/qr")
    public ResponseEntity<Message> checkInByQr(@Valid @RequestBody QrCheckInRequest request) {

        log.info("==> [POST /api/visits/check-in/qr] QR: {}", request.getQrCode());

        ResponseEntity<Message> response = visitService.checkInByQr(
                request.getQrCode(),
                request.getLatitude(),
                request.getLongitude()
        );

        log.info("<== [POST /api/visits/check-in/qr] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== COMPLETAR VISITA (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PostMapping("/{id}/complete")
    public ResponseEntity<Message> completeVisit(
            @PathVariable Long id,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String notes) {

        log.info("==> [POST /api/visits/{}/complete]", id);

        ResponseEntity<Message> response = visitService.completeVisit(id, latitude, longitude, notes);

        log.info("<== [POST /api/visits/{}/complete] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== SKIP VISITA (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PostMapping("/{id}/skip")
    public ResponseEntity<Message> skipVisit(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        log.info("==> [POST /api/visits/{}/skip]", id);

        ResponseEntity<Message> response = visitService.skipVisit(id, reason);

        log.info("<== [POST /api/visits/{}/skip] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== VISITAS DE HOY POR DEALER (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @GetMapping("/today")
    public ResponseEntity<Message> getTodayVisits() {

        log.info("==> [GET /api/visits/today]");

        ResponseEntity<Message> response = visitService.getTodayVisitsByDealer();

        log.info("<== [GET /api/visits/today] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== VISITAS ABIERTAS (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @GetMapping("/open")
    public ResponseEntity<Message> getOpenVisits() {

        log.info("==> [GET /api/visits/open]");

        ResponseEntity<Message> response = visitService.getOpenVisits();

        log.info("<== [GET /api/visits/open] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== VISITAS POR DEALER Y FECHA (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dealer/{dealerId}/date/{date}")
    public ResponseEntity<Message> getVisitsByDealerAndDate(
            @PathVariable Long dealerId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        log.info("==> [GET /api/visits/dealer/{}/date/{}]", dealerId, date);

        ResponseEntity<Message> response = visitService.getVisitsByDealerAndDate(dealerId, date);

        log.info("<== [GET /api/visits/dealer/{}/date/{}] Status: {}", dealerId, date, response.getStatusCode());

        return response;
    }

    // =============== VISITAS POR DEALER (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dealer/{dealerId}")
    public ResponseEntity<Message> getVisitsByDealer(@PathVariable Long dealerId) {

        log.info("==> [GET /api/visits/dealer/{}]", dealerId);

        ResponseEntity<Message> response = visitService.getVisitsByDealer(dealerId);

        log.info("<== [GET /api/visits/dealer/{}] Status: {}", dealerId, response.getStatusCode());

        return response;
    }

    // =============== VISITAS POR TIENDA Y FECHA (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/store/{storeId}/date/{date}")
    public ResponseEntity<Message> getVisitsByStoreAndDate(
            @PathVariable Long storeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        log.info("==> [GET /api/visits/store/{}/date/{}]", storeId, date);

        ResponseEntity<Message> response = visitService.getVisitsByStoreAndDate(storeId, date);

        log.info("<== [GET /api/visits/store/{}/date/{}] Status: {}", storeId, date, response.getStatusCode());

        return response;
    }

    // =============== FILTRAR VISITAS (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/filter")
    public ResponseEntity<Message> filterVisits(
            @RequestParam(required = false) Long dealerId,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) VisitStatusEnum status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("==> [GET /api/visits/filter]");

        ResponseEntity<Message> response = visitService.filterVisits(dealerId, storeId, status, startDate, endDate);

        log.info("<== [GET /api/visits/filter] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== OBTENER VISITA POR ID (DEALER/ADMIN) ==================
    @PreAuthorize("hasAnyRole('DEALER', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Message> getVisitById(@PathVariable Long id) {

        log.info("==> [GET /api/visits/{}]", id);

        ResponseEntity<Message> response = visitService.getVisitById(id);

        log.info("<== [GET /api/visits/{}] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== CREAR VISITA MANUAL (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/")
    public ResponseEntity<Message> createVisit(@Valid @RequestBody VisitDTO dto) {

        log.info("==> [POST /api/visits] Crear visita manual");

        ResponseEntity<Message> response = visitService.createManualVisit(dto);

        log.info("<== [POST /api/visits] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== ACTUALIZAR VISITA (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Message> updateVisit(
            @PathVariable Long id,
            @Valid @RequestBody VisitDTO dto) {

        log.info("==> [PUT /api/visits/{}]", id);

        ResponseEntity<Message> response = visitService.updateVisit(id, dto);

        log.info("<== [PUT /api/visits/{}] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== TOGGLE ACTIVE VISITA (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Message> toggleActive(@PathVariable Long id) {

        log.info("==> [PATCH /api/visits/{}/toggle] Toggle visita", id);

        // Obtener visita actual
        ResponseEntity<Message> currentResponse = visitService.getVisitById(id);
        if (currentResponse.getStatusCode() != HttpStatus.OK) {
            return currentResponse;
        }

        VisitEntity visit = (VisitEntity) currentResponse.getBody().getResult();
        boolean newStatus = !visit.getIsActive();

        // Crear DTO para actualizar
        VisitDTO dto = new VisitDTO();
        dto.setIsActive(newStatus);

        ResponseEntity<Message> response = visitService.updateVisit(id, dto);

        log.info("<== [PATCH /api/visits/{}/toggle] Status: {}", id, response.getStatusCode());

        return response;
    }
}