package org.example.integradoranarvaez.order.model;

import org.example.integradoranarvaez.notification.model.NotificationService;
import org.example.integradoranarvaez.notification_type.NotificationTypeEnum;
import org.example.integradoranarvaez.order_item.model.OrderItemEntity;
import org.example.integradoranarvaez.order_item.model.OrderItemRepository;
import org.example.integradoranarvaez.order_status.OrderStatusEntity;
import org.example.integradoranarvaez.order_status.OrderStatusEnum;
import org.example.integradoranarvaez.order_status.OrderStatusRepository;
import org.example.integradoranarvaez.product.model.ProductEntity;
import org.example.integradoranarvaez.product.model.ProductRepository;
import org.example.integradoranarvaez.store.model.StoreEntity;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.example.integradoranarvaez.user.model.UserService;
import org.example.integradoranarvaez.model.RoleEnum;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.example.integradoranarvaez.visit.model.VisitEntity;
import org.example.integradoranarvaez.visit.model.VisitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final VisitRepository visitRepository;
    private final ProductRepository productRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        VisitRepository visitRepository,
                        ProductRepository productRepository,
                        OrderStatusRepository orderStatusRepository,
                        UserService userService,
                        NotificationService notificationService,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.visitRepository = visitRepository;
        this.productRepository = productRepository;
        this.orderStatusRepository = orderStatusRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    // =============== CREAR PEDIDO (DRAFT) ==================
    @Transactional
    public ResponseEntity<Message> createOrder(OrderDTO dto) {

        Long currentDealerId = userService.getCurrentUserId();

        log.info("==> [OrderService.createOrder] Dealer: {}, Visit: {}", currentDealerId, dto.getVisitId());

        // 0. Verificar si el pedido offline ya fue sincronizado (prevenir duplicados)
        if (dto.getOfflineUniqueId() != null && !dto.getOfflineUniqueId().isEmpty()) {
            Optional<OrderEntity> existingOrder = orderRepository.findByOfflineUniqueId(dto.getOfflineUniqueId());
            if (existingOrder.isPresent()) {
                log.warn("Pedido con offlineUniqueId {} ya existe. Retornando pedido existente.", dto.getOfflineUniqueId());
                return ResponseEntity.ok(
                        new Message("Pedido ya existe (prevención de duplicado)", existingOrder.get(), TypesResponse.SUCCESS)
                );
            }
        }

        // 1. Validar visita
        Optional<VisitEntity> visitOpt = visitRepository.findById(dto.getVisitId());
        if (visitOpt.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Visita no encontrada", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        VisitEntity visit = visitOpt.get();

        // 2. Validar que el dealer sea dueño de la visita
        if (!visit.getDealer().getId().equals(currentDealerId)) {
            throw new AccessDeniedException("No tiene permisos para crear pedido en esta visita");
        }

        // 3. Crear orden con estado PENDING (borrador)
        OrderStatusEntity pendingStatus = orderStatusRepository.findByCode(OrderStatusEnum.PENDING)
                .orElseThrow(() -> new RuntimeException("Estado PENDING no encontrado"));

        OrderEntity order = new OrderEntity();
        order.setInternalCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setOrderDate(LocalDate.now());
        order.setDealer(visit.getDealer());
        order.setStore(visit.getStore());
        order.setVisit(visit);
        order.setStatus(pendingStatus);
        order.setNotes(dto.getNotes());
        order.setOfflineUniqueId(dto.getOfflineUniqueId()); // Guardar el ID único offline
        order.setIsActive(true);
        order.setCreatedAt(LocalDateTime.now());

        order = orderRepository.save(order);

        // 4. Agregar items si vienen
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            BigDecimal total = BigDecimal.ZERO;

            for (OrderDTO.OrderItemDTO itemDto : dto.getItems()) {
                Optional<ProductEntity> productOpt = productRepository.findById(itemDto.getProductId());
                if (productOpt.isEmpty()) {
                    log.warn("Producto no encontrado: {}", itemDto.getProductId());
                    continue;
                }

                ProductEntity product = productOpt.get();
                BigDecimal unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.valueOf(product.getPrice());

                OrderItemEntity item = new OrderItemEntity(order, product, itemDto.getQuantity(), unitPrice);
                item.setNotes(itemDto.getNotes());

                // Agregar a la lista del order (cascade hará el save)
                order.getItems().add(item);

                total = total.add(item.getSubtotal());
            }

            order.setTotalAmount(total);
            order = orderRepository.save(order);
        }

        log.info("<== [OrderService.createOrder] Pedido creado ID: {}", order.getId());

        return ResponseEntity.ok(
                new Message("Pedido creado en borrador", order, TypesResponse.SUCCESS)
        );
    }

    // =============== ACTUALIZAR PEDIDO (DRAFT) ==================
    @Transactional
    public ResponseEntity<Message> updateOrder(Long orderId, OrderDTO dto) {

        Long currentDealerId = userService.getCurrentUserId();

        log.info("==> [OrderService.updateOrder] Order ID: {}", orderId);

        // 1. Validar orden
        Optional<OrderEntity> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Pedido no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        OrderEntity order = orderOpt.get();

        // 2. Validar que el dealer sea dueño
        if (!order.getDealer().getId().equals(currentDealerId)) {
            throw new AccessDeniedException("No tiene permisos para actualizar este pedido");
        }

        // 3. Validar que esté en PENDING (solo se pueden editar borradores)
        if (order.getStatus().getCode() != OrderStatusEnum.PENDING) {
            return new ResponseEntity<>(
                    new Message("Solo se pueden editar pedidos en borrador", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 4. Actualizar notas
        if (dto.getNotes() != null) {
            order.setNotes(dto.getNotes());
        }

        // 5. Actualizar items
        if (dto.getItems() != null) {
            // Limpiar la lista existente (correcto para orphanRemoval)
            order.getItems().clear();

            BigDecimal total = BigDecimal.ZERO;

            for (OrderDTO.OrderItemDTO itemDto : dto.getItems()) {
                Optional<ProductEntity> productOpt = productRepository.findById(itemDto.getProductId());
                if (productOpt.isEmpty()) {
                    log.warn("Producto no encontrado: {}", itemDto.getProductId());
                    continue;
                }

                ProductEntity product = productOpt.get();
                BigDecimal unitPrice = itemDto.getUnitPrice() != null ? itemDto.getUnitPrice() : BigDecimal.valueOf(product.getPrice());

                OrderItemEntity item = new OrderItemEntity(order, product, itemDto.getQuantity(), unitPrice);
                item.setNotes(itemDto.getNotes());

                // Agregar a la lista en lugar de save directo
                order.getItems().add(item);

                total = total.add(item.getSubtotal());
            }

            order.setTotalAmount(total);
        }

        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        log.info("<== [OrderService.updateOrder] Pedido actualizado ID: {}", orderId);

        return ResponseEntity.ok(
                new Message("Pedido actualizado", order, TypesResponse.SUCCESS)
        );
    }

    // =============== ENVIAR PEDIDO (PENDING -> SENT) ==================
    @Transactional
    public ResponseEntity<Message> sendOrder(Long orderId) {

        Long currentDealerId = userService.getCurrentUserId();

        log.info("==> [OrderService.sendOrder] Order ID: {}", orderId);

        // 1. Validar orden
        Optional<OrderEntity> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Pedido no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        OrderEntity order = orderOpt.get();

        // 2. Validar que el dealer sea dueño
        if (!order.getDealer().getId().equals(currentDealerId)) {
            throw new AccessDeniedException("No tiene permisos para enviar este pedido");
        }

        // 3. Validar que esté en PENDING
        if (order.getStatus().getCode() != OrderStatusEnum.PENDING) {
            return new ResponseEntity<>(
                    new Message("Solo se pueden enviar pedidos en borrador", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 4. Validar que tenga al menos un item
        List<OrderItemEntity> items = orderItemRepository.findAllByOrder_Id(orderId);
        if (items.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("El pedido debe tener al menos un producto", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        // 5. Cambiar estado a SENT y registrar fecha de envío
        OrderStatusEntity sentStatus = orderStatusRepository.findByCode(OrderStatusEnum.SENT)
                .orElseThrow(() -> new RuntimeException("Estado SENT no encontrado"));

        order.setStatus(sentStatus);
        order.setSentAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        order = orderRepository.save(order);

        log.info("<== [OrderService.sendOrder] Pedido enviado ID: {}, Fecha: {}", orderId, order.getSentAt());

        // Notificar a todos los administradores
        try {
            List<UserEntity> admins = userRepository.findAllByRole_RoleEnum(RoleEnum.ADMIN);
            for (UserEntity admin : admins) {
                String title = "Nuevo pedido enviado";
                String message = String.format("El repartidor %s %s ha enviado un nuevo pedido para la tienda %s",
                        order.getDealer().getName(),
                        order.getDealer().getLastName(),
                        order.getStore().getName());
                notificationService.createNotification(
                        admin.getId(),
                        NotificationTypeEnum.NEW_ORDER_SENT,
                        title,
                        message,
                        orderId
                );
            }
            log.info("Notificaciones enviadas a administradores por pedido ID: {}", orderId);
        } catch (Exception e) {
            log.error("Error al enviar notificaciones de pedido: {}", e.getMessage());
            // No fallar el pedido si la notificación falla
        }

        return ResponseEntity.ok(
                new Message("Pedido enviado exitosamente", order, TypesResponse.SUCCESS)
        );
    }

    // =============== OBTENER PEDIDO POR ID ==================
    public ResponseEntity<Message> getOrderById(Long orderId) {

        log.info("==> [OrderService.getOrderById] Order ID: {}", orderId);

        Optional<OrderEntity> orderOpt = orderRepository.findByIdWithItems(orderId);

        if (orderOpt.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Pedido no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        OrderEntity order = orderOpt.get();

        log.info("<== [OrderService.getOrderById] Pedido encontrado ID: {}", orderId);

        return ResponseEntity.ok(
                new Message("Pedido encontrado", order, TypesResponse.SUCCESS)
        );
    }

    // =============== OBTENER PEDIDOS POR VISITA ==================
    public ResponseEntity<Message> getOrdersByVisit(Long visitId) {

        log.info("==> [OrderService.getOrdersByVisit] Visit ID: {}", visitId);

        List<OrderEntity> orders = orderRepository.findAllByVisit_Id(visitId);

        log.info("<== [OrderService.getOrdersByVisit] Total pedidos: {}", orders.size());

        return ResponseEntity.ok(
                new Message("Pedidos de la visita encontrados", orders, TypesResponse.SUCCESS)
        );
    }

    // =============== OBTENER PEDIDOS DEL DEALER ==================
    public ResponseEntity<Message> getOrdersByDealer() {

        Long currentDealerId = userService.getCurrentUserId();

        log.info("==> [OrderService.getOrdersByDealer] Dealer ID: {}", currentDealerId);

        List<OrderEntity> orders = orderRepository.findAllByDealer_Id(currentDealerId);

        log.info("<== [OrderService.getOrdersByDealer] Total pedidos: {}", orders.size());

        return ResponseEntity.ok(
                new Message("Pedidos del dealer encontrados", orders, TypesResponse.SUCCESS)
        );
    }

    // =============== CANCELAR PEDIDO ==================
    @Transactional
    public ResponseEntity<Message> cancelOrder(Long orderId) {

        Long currentDealerId = userService.getCurrentUserId();

        log.info("==> [OrderService.cancelOrder] Order ID: {}", orderId);

        Optional<OrderEntity> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return new ResponseEntity<>(
                    new Message("Pedido no encontrado", null, TypesResponse.WARNING),
                    HttpStatus.NOT_FOUND
            );
        }

        OrderEntity order = orderOpt.get();

        // Validar que el dealer sea dueño
        if (!order.getDealer().getId().equals(currentDealerId)) {
            throw new AccessDeniedException("No tiene permisos para cancelar este pedido");
        }

        // Solo se pueden cancelar pedidos PENDING
        if (order.getStatus().getCode() != OrderStatusEnum.PENDING) {
            return new ResponseEntity<>(
                    new Message("Solo se pueden cancelar pedidos en borrador", null, TypesResponse.WARNING),
                    HttpStatus.BAD_REQUEST
            );
        }

        OrderStatusEntity cancelledStatus = orderStatusRepository.findByCode(OrderStatusEnum.CANCELLED)
                .orElseThrow(() -> new RuntimeException("Estado CANCELLED no encontrado"));

        order.setStatus(cancelledStatus);
        order.setUpdatedAt(LocalDateTime.now());

        order = orderRepository.save(order);

        log.info("<== [OrderService.cancelOrder] Pedido cancelado ID: {}", orderId);

        return ResponseEntity.ok(
                new Message("Pedido cancelado", order, TypesResponse.SUCCESS)
        );
    }

    // =============== FILTRAR PEDIDOS (ADMIN) ==================
    public ResponseEntity<Message> filterOrders(Long dealerId, Long storeId, OrderStatusEnum status, LocalDate startDate, LocalDate endDate) {

        log.info("==> [OrderService.filterOrders] dealer={}, store={}, status={}, startDate={}, endDate={}",
                dealerId, storeId, status, startDate, endDate);

        List<OrderEntity> allOrders = orderRepository.findAll();

        // Filtrado manual
        List<OrderEntity> filteredOrders = allOrders.stream()
                .filter(order -> dealerId == null || order.getDealer().getId().equals(dealerId))
                .filter(order -> storeId == null || order.getStore().getId().equals(storeId))
                .filter(order -> status == null || order.getStatus().getCode() == status)
                .filter(order -> {
                    if (startDate == null && endDate == null) return true;
                    LocalDate orderDate = order.getCreatedAt().toLocalDate();
                    boolean afterStart = startDate == null || !orderDate.isBefore(startDate);
                    boolean beforeEnd = endDate == null || !orderDate.isAfter(endDate);
                    return afterStart && beforeEnd;
                })
                .toList();

        log.info("<== [OrderService.filterOrders] Total filtered: {}", filteredOrders.size());

        return ResponseEntity.ok(
                new Message("Pedidos filtrados", filteredOrders, TypesResponse.SUCCESS)
        );
    }
}