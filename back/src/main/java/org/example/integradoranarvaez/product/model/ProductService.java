package org.example.integradoranarvaez.product.model;

import org.example.integradoranarvaez.utils.FileStorageService;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    public ProductService(ProductRepository productRepository,
                          FileStorageService fileStorageService) {
        this.productRepository = productRepository;
        this.fileStorageService = fileStorageService;
    }

    // =============== CREATE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> create(ProductDTO dto, MultipartFile file) throws IOException {

        log.info("==> [ProductService.create] Crear producto: {} (SKU: {})", dto.getName(), dto.getSku());

        if (productRepository.existsBySku(dto.getSku())) {
            log.info("==> [ProductService.create] SKU ya registrado: {}", dto.getSku());
            return new ResponseEntity<>(
                    new Message("SKU ya registrado", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        try {
            ProductEntity product = new ProductEntity();
            product.setName(dto.getName());
            product.setSku(dto.getSku());
            product.setUnit(dto.getUnit());
            product.setPrice(dto.getPrice());
            product.setIsActive(true);
            product.setCreatedAt(LocalDateTime.now());

            if (file != null && !file.isEmpty()) {
                String imageUrl = fileStorageService.saveImage(file, "products");
                product.setImageUrl(imageUrl);
            }

            product = productRepository.saveAndFlush(product);

            log.info("<== [ProductService.create] Producto creado ID {} - {}", product.getId(), product.getName());

            return new ResponseEntity<>(
                    new Message("Producto creado", product, TypesResponse.SUCCESS),
                    HttpStatus.CREATED
            );

        } catch (Exception e) {
            log.error("[ProductService.create] Error guardando producto: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    new Message("Error guardando producto", null, TypesResponse.ERROR),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============== UPDATE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> update(Long id, ProductDTO dto, MultipartFile file) throws IOException {

        log.info("==> [ProductService.update] Actualizar producto ID {}", id);

        Optional<ProductEntity> opt = productRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [ProductService.update] Producto no encontrado ID {}", id);
            return new ResponseEntity<>(
                    new Message("Producto no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        if (productRepository.existsBySkuAndIdNot(dto.getSku(), id)) {
            log.info("==> [ProductService.update] SKU duplicado: {}", dto.getSku());
            return new ResponseEntity<>(
                    new Message("Ya existe otro producto con ese SKU", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        try {
            ProductEntity product = opt.get();
            product.setName(dto.getName());
            product.setSku(dto.getSku());
            product.setUnit(dto.getUnit());
            product.setPrice(dto.getPrice());

            if (dto.getIsActive() != null) {
                product.setIsActive(dto.getIsActive());
            }

            if (file != null && !file.isEmpty()) {
                log.info("[ProductService.update] Actualizando imagen de producto ID {}", id);
                String imageUrl = fileStorageService.saveImage(file, "products");
                product.setImageUrl(imageUrl);
            }

            productRepository.saveAndFlush(product);

            log.info("<== [ProductService.update] Producto ID {} actualizado", id);

            return ResponseEntity.ok(
                    new Message("Producto actualizado", product, TypesResponse.SUCCESS)
            );

        } catch (Exception e) {
            log.error("[ProductService.update] Error actualizando producto: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    new Message("Error actualizando producto", null, TypesResponse.ERROR),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // =============== TOGGLE ACTIVE ==================
    @Transactional(rollbackFor = SQLException.class)
    public ResponseEntity<Message> toggleActive(Long id) {

        log.info("==> [ProductService.toggleActive] Toggle producto ID {}", id);

        Optional<ProductEntity> opt = productRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("==> [ProductService.toggleActive] Producto no encontrado ID {}", id);
            return new ResponseEntity<>(
                    new Message("Producto no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        ProductEntity product = opt.get();
        boolean newStatus = !product.getIsActive();
        product.setIsActive(newStatus);
        productRepository.saveAndFlush(product);

        String estado = newStatus ? "activado" : "desactivado";
        log.info("<== [ProductService.toggleActive] Producto ID {} {}", id, estado);

        return ResponseEntity.ok(
                new Message("Producto " + estado, product, TypesResponse.SUCCESS)
        );
    }

    // =============== FIND ONE ==================
    public ResponseEntity<Message> findOne(Long id) {

        log.info("==> [ProductService.findOne] Buscar producto ID {}", id);

        Optional<ProductEntity> opt = productRepository.findById(id);
        if (opt.isEmpty()) {
            log.info("<== [ProductService.findOne] Producto no encontrado ID {}", id);
            return new ResponseEntity<>(
                    new Message("Producto no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        ProductEntity product = opt.get();

        log.info("<== [ProductService.findOne] Producto encontrado ID {}", id);

        return ResponseEntity.ok(
                new Message("Producto encontrado", product, TypesResponse.SUCCESS)
        );
    }

    // =============== LIST ==================
    public ResponseEntity<Message> findAll() {

        log.info("==> [ProductService.findAll] Listar todos los productos");

        List<ProductEntity> list = productRepository.findAll();

        log.info("<== [ProductService.findAll] Total productos: {}", list.size());

        return ResponseEntity.ok(
                new Message("Listado de productos", list, TypesResponse.SUCCESS)
        );
    }

    public ResponseEntity<Message> findAllActive() {

        log.info("==> [ProductService.findAllActive] Listar productos activos");

        List<ProductEntity> list = productRepository.findAllByIsActiveTrue();

        log.info("<== [ProductService.findAllActive] Total productos activos: {}", list.size());

        return ResponseEntity.ok(
                new Message("Listado de productos activos", list, TypesResponse.SUCCESS)
        );
    }
}