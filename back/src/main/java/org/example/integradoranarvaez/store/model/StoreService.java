package org.example.integradoranarvaez.store.model;

import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreService.class);

    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    // =============== CREATE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> create(StoreDTO dto) {

        log.info("==> [StoreService.create] Crear tienda con nombre: {}", dto.getName());

        if (storeRepository.existsByName(dto.getName())) {
            log.info("==> [StoreService.create] Nombre ya registrado: {}", dto.getName());
            return new ResponseEntity<>(
                    new Message("Nombre de tienda ya registrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        StoreEntity store = new StoreEntity();
        store.setName(dto.getName());
        store.setAddress(dto.getAddress());
        store.setLatitude(dto.getLatitude());
        store.setLongitude(dto.getLongitude());

        // QR generado por el backend
        String qrCode = generateUniqueQrCode();
        store.setQrCode(qrCode);

        store.setIsActive(true);
        store.setCreatedAt(LocalDateTime.now());

        store = storeRepository.saveAndFlush(store);

        log.info("<== [StoreService.create] Tienda creada con ID {} y QR {}", store.getId(), store.getQrCode());

        return new ResponseEntity<>(
                new Message("Tienda creada", store, TypesResponse.SUCCESS),
                HttpStatus.CREATED
        );
    }

    // =============== UPDATE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> update(Long id, StoreDTO dto) {

        log.info("==> [StoreService.update] Actualizar tienda ID {}", id);

        Optional<StoreEntity> opt = storeRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [StoreService.update] Tienda no encontrada ID {}", id);
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        StoreEntity store = opt.get();

        // Si cambia el nombre, validar duplicado
        if (!store.getName().equalsIgnoreCase(dto.getName())
                && storeRepository.existsByName(dto.getName())) {
            log.info("==> [StoreService.update] Nombre ya usado por otra tienda: {}", dto.getName());
            return new ResponseEntity<>(
                    new Message("Nombre de tienda ya registrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

       /* // Si cambia el QR, validar duplicado
        if (!store.getQrCode().equalsIgnoreCase(dto.getQrCode())
                && storeRepository.existsByQrCode(dto.getQrCode())) {
            log.info("==> [StoreService.update] QR code ya usado por otra tienda: {}", dto.getQrCode());
            return new ResponseEntity<>(
                    new Message("Código QR ya registrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }*/

        store.setName(dto.getName());
        store.setAddress(dto.getAddress());
        store.setLatitude(dto.getLatitude());
        store.setLongitude(dto.getLongitude());


        if (dto.getIsActive() != null) {
            store.setIsActive(dto.getIsActive());
        }

        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.saveAndFlush(store);

        log.info("<== [StoreService.update] Tienda ID {} actualizada", id);

        return ResponseEntity.ok(
                new Message("Tienda actualizada", store, TypesResponse.SUCCESS)
        );
    }

    // =============== TOGGLE ACTIVE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> toggleActive(Long id) {

        log.info("==> [StoreService.toggleActive] Toggle tienda ID {}", id);

        Optional<StoreEntity> opt = storeRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [StoreService.toggleActive] Tienda no encontrada ID {}", id);
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        StoreEntity store = opt.get();
        boolean newStatus = !store.getIsActive();
        store.setIsActive(newStatus);
        store.setUpdatedAt(LocalDateTime.now());
        storeRepository.saveAndFlush(store);

        String statusLabel = newStatus ? "activada" : "desactivada";
        log.info("<== [StoreService.toggleActive] Tienda ID {} {}", id, statusLabel);

        return ResponseEntity.ok(
                new Message("Tienda " + statusLabel, store, TypesResponse.SUCCESS)
        );
    }

    // =============== LIST ==================
    public ResponseEntity<Message> findAll() {

        log.info("==> [StoreService.findAll] Listar todas las tiendas");

        List<StoreEntity> stores = storeRepository.findAll();

        log.info("<== [StoreService.findAll] Total tiendas: {}", stores.size());

        return ResponseEntity.ok(
                new Message("Listado de tiendas", stores, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findAllActive() {

        log.info("==> [StoreService.findAllActive] Listar tiendas activas");

        List<StoreEntity> stores = storeRepository.findAllByIsActiveTrue();

        log.info("<== [StoreService.findAllActive] Total tiendas activas: {}", stores.size());

        return ResponseEntity.ok(
                new Message("Listado de tiendas activas", stores, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findOne(Long id) {

        log.info("==> [StoreService.findOne] Buscar tienda ID {}", id);
        Optional<StoreEntity> opt = storeRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("<== [StoreService.findOne] Tienda no encontrada ID {}", id);
            return new ResponseEntity<>(
                    new Message("Tienda no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }
        StoreEntity store = opt.get();
        log.info("<== [StoreService.findOne] Tienda encontrada ID {}", id);
        return ResponseEntity.ok(
                new Message("Tienda encontrada", store, TypesResponse.SUCCESS)
        );
    }

    private String generateUniqueQrCode() {
        String code;
        do {
            // Puedes cambiar el formato si quieres algo más "legible"
            code = "STORE-" + UUID.randomUUID();
        } while (storeRepository.existsByQrCode(code));
        return code;
    }
}