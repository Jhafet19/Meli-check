package org.example.integradoranarvaez.order.control;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.integradoranarvaez.order.model.OrderDTO;
import org.example.integradoranarvaez.order.model.OrderService;
import org.example.integradoranarvaez.order_status.OrderStatusEnum;
import org.example.integradoranarvaez.utils.Message;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // =============== CREAR PEDIDO (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PostMapping("/")
    public ResponseEntity<Message> createOrder(@Valid @RequestBody OrderDTO dto) {

        log.info("==> [POST /api/orders] Crear pedido");

        ResponseEntity<Message> response = orderService.createOrder(dto);

        log.info("<== [POST /api/orders] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== ACTUALIZAR PEDIDO (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PutMapping("/{id}")
    public ResponseEntity<Message> updateOrder(
            @PathVariable Long id,
            @Valid @RequestBody OrderDTO dto) {

        log.info("==> [PUT /api/orders/{}]", id);

        ResponseEntity<Message> response = orderService.updateOrder(id, dto);

        log.info("<== [PUT /api/orders/{}] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== ENVIAR PEDIDO (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PostMapping("/{id}/send")
    public ResponseEntity<Message> sendOrder(@PathVariable Long id) {

        log.info("==> [POST /api/orders/{}/send]", id);

        ResponseEntity<Message> response = orderService.sendOrder(id);

        log.info("<== [POST /api/orders/{}/send] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== CANCELAR PEDIDO (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Message> cancelOrder(@PathVariable Long id) {

        log.info("==> [POST /api/orders/{}/cancel]", id);

        ResponseEntity<Message> response = orderService.cancelOrder(id);

        log.info("<== [POST /api/orders/{}/cancel] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== OBTENER PEDIDO POR ID (DEALER/ADMIN) ==================
    @PreAuthorize("hasAnyRole('DEALER', 'ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Message> getOrderById(@PathVariable Long id) {

        log.info("==> [GET /api/orders/{}]", id);

        ResponseEntity<Message> response = orderService.getOrderById(id);

        log.info("<== [GET /api/orders/{}] Status: {}", id, response.getStatusCode());

        return response;
    }

    // =============== OBTENER PEDIDOS POR VISITA (DEALER/ADMIN) ==================
    @PreAuthorize("hasAnyRole('DEALER', 'ADMIN')")
    @GetMapping("/visit/{visitId}")
    public ResponseEntity<Message> getOrdersByVisit(@PathVariable Long visitId) {

        log.info("==> [GET /api/orders/visit/{}]", visitId);

        ResponseEntity<Message> response = orderService.getOrdersByVisit(visitId);

        log.info("<== [GET /api/orders/visit/{}] Status: {}", visitId, response.getStatusCode());

        return response;
    }

    // =============== OBTENER PEDIDOS DEL DEALER (DEALER) ==================
    @PreAuthorize("hasRole('DEALER')")
    @GetMapping("/my-orders")
    public ResponseEntity<Message> getMyOrders() {

        log.info("==> [GET /api/orders/my-orders]");

        ResponseEntity<Message> response = orderService.getOrdersByDealer();

        log.info("<== [GET /api/orders/my-orders] Status: {}", response.getStatusCode());

        return response;
    }

    // =============== FILTRAR PEDIDOS (ADMIN) ==================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/filter")
    public ResponseEntity<Message> filterOrders(
            @RequestParam(required = false) Long dealerId,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) OrderStatusEnum status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        log.info("==> [GET /api/orders/filter]");

        ResponseEntity<Message> response = orderService.filterOrders(dealerId, storeId, status, startDate, endDate);

        log.info("<== [GET /api/orders/filter] Status: {}", response.getStatusCode());

        return response;
    }
}