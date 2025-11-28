package org.example.integradoranarvaez.product.control;


import java.util.List;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.integradoranarvaez.product.model.ProductDTO;
import org.example.integradoranarvaez.product.model.ProductService;
import org.example.integradoranarvaez.utils.Message;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // =============== CREATE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/")
    public ResponseEntity<Message> create(
            @RequestParam("name") String name,
            @RequestParam("sku") String sku,
            @RequestParam("unit") String unit,
            @RequestParam("price") Double price,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) throws IOException {

        log.info("==> [POST /api/products] Crear producto {}", name);

        ProductDTO dto = new ProductDTO();
        dto.setName(name);
        dto.setSku(sku);
        dto.setUnit(unit);
        dto.setPrice(price);

        // Validaciones de @Valid “a mano” si quieres, o cambias a @ModelAttribute ProductDTO

        ResponseEntity<Message> response = productService.create(dto, file);

        log.info("<== [POST /api/products] Status {}", response.getStatusCode());
        return response;
    }

    // =============== UPDATE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Message> update(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("sku") String sku,
            @RequestParam("unit") String unit,
            @RequestParam("price") Double price,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) throws IOException {

        log.info("==> [PUT /api/products/{}] Actualizar producto", id);

        ProductDTO dto = new ProductDTO();
        dto.setId(id);
        dto.setName(name);
        dto.setSku(sku);
        dto.setUnit(unit);
        dto.setPrice(price);
        dto.setIsActive(isActive);

        ResponseEntity<Message> response = productService.update(id, dto, file);

        log.info("<== [PUT /api/products/{}] Status {}", id, response.getStatusCode());
        return response;
    }

    // =============== TOGGLE ACTIVE (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Message> toggleActive(@PathVariable Long id) {

        log.info("==> [PATCH /api/products/{}/toggle] Toggle producto", id);

        ResponseEntity<Message> response = productService.toggleActive(id);

        log.info("<== [PATCH /api/products/{}/toggle] Status {}", id, response.getStatusCode());
        return response;
    }

    // =============== FIND ONE (ADMIN & DEALER) ==================
    @PreAuthorize("hasAnyRole('ADMIN','DEALER')")
    @GetMapping("/{id}")
    public ResponseEntity<Message> getOne(@PathVariable Long id) {

        log.info("==> [GET /api/products/{}] Obtener producto", id);

        ResponseEntity<Message> response = productService.findOne(id);

        log.info("<== [GET /api/products/{}] Status {}", id, response.getStatusCode());
        return response;
    }

    // =============== LIST ALL (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/")
    public ResponseEntity<Message> getAll() {

        log.info("==> [GET /api/products] Listar todos los productos");

        ResponseEntity<Message> response = productService.findAll();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/products] Total productos: {}", size);
        return response;
    }

    // =============== LIST ACTIVE (ADMIN & DEALER) ==================
    @PreAuthorize("hasAnyRole('ADMIN','DEALER')")
    @GetMapping("/active")
    public ResponseEntity<Message> getAllActive() {

        log.info("==> [GET /api/products/active] Listar productos activos");

        ResponseEntity<Message> response = productService.findAllActive();

        Object result = response.getBody() != null ? response.getBody().getResult() : null;
        int size = (result instanceof List<?> list) ? list.size() : 0;

        log.info("<== [GET /api/products/active] Total productos activos: {}", size);
        return response;
    }
}