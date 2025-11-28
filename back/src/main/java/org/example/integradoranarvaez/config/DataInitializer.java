package org.example.integradoranarvaez.config;

import org.example.integradoranarvaez.model.RoleEntity;
import org.example.integradoranarvaez.model.RoleEnum;
import org.example.integradoranarvaez.model.RoleRepository;
import org.example.integradoranarvaez.order_status.OrderStatusEntity;
import org.example.integradoranarvaez.order_status.OrderStatusEnum;
import org.example.integradoranarvaez.order_status.OrderStatusRepository;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.example.integradoranarvaez.visit_status.VisitStatusEntity;
import org.example.integradoranarvaez.visit_status.VisitStatusEnum;
import org.example.integradoranarvaez.visit_status.VisitStatusRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.example.integradoranarvaez.assignment_type.AssignmentTypeEntity;
import org.example.integradoranarvaez.assignment_type.AssignmentTypeEnum;
import org.example.integradoranarvaez.assignment_type.AssignmentTypeRepository;
import org.example.integradoranarvaez.origin.OriginEntity;
import org.example.integradoranarvaez.origin.OriginEnum;
import org.example.integradoranarvaez.origin.OriginRepository;
import org.example.integradoranarvaez.notification_type.NotificationTypeEntity;
import org.example.integradoranarvaez.notification_type.NotificationTypeEnum;
import org.example.integradoranarvaez.notification_type.NotificationTypeRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    public static final String ROOT_ADMIN_EMAIL = "admin@gmail.com";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrderStatusRepository orderStatusRepository;
    private final VisitStatusRepository visitStatusRepository;
    private final AssignmentTypeRepository assignmentTypeRepository;
    private final OriginRepository originRepository;
    private final NotificationTypeRepository notificationTypeRepository;

    private static final String IMAGE_BASE_PATH = "uploads/courses/";

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder, OrderStatusRepository orderStatusRepository, VisitStatusRepository visitStatusRepository, AssignmentTypeRepository assignmentTypeRepository, OriginRepository originRepository, NotificationTypeRepository notificationTypeRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;

        this.orderStatusRepository = orderStatusRepository;
        this.visitStatusRepository = visitStatusRepository;

        this.assignmentTypeRepository = assignmentTypeRepository;
        this.originRepository = originRepository;
        this.notificationTypeRepository = notificationTypeRepository;
    }

    @Override
    public void run(String... args) throws Exception {

        System.err.println(">>> DataInitializer ejecutándose...");
        // Crear roles si no existen
        for (RoleEnum roleEnum : RoleEnum.values()) {
            if (!roleRepository.existsByRoleEnum(roleEnum)) {
                RoleEntity role = new RoleEntity();
                role.setRoleEnum(roleEnum);
                roleRepository.save(role);
            }
        }

        // Crear usuarios de prueba si no existen
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            UserEntity admin = new UserEntity(
                    "Admin", "Test", "User",
                    "admin@gmail.com", "0123456789", passwordEncoder.encode("1234"),
                    true,
                    roleRepository.findByRoleEnum(RoleEnum.ADMIN).get()
            );
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmail("dealer@gmail.com")) {
            UserEntity dealer = new UserEntity(
                    "dealer", "Test", "User", "dealer@gmail.com",
                    "0123456789", passwordEncoder.encode("1234"),
                    true,
                    roleRepository.findByRoleEnum(RoleEnum.DEALER).get()
            );
            userRepository.save(dealer);
        }


        UserEntity student = userRepository.findByEmail("dealer@gmail.com").orElse(null);

        // Validar que no sean null
        if (student == null) {
            System.err.println("No se pudieron obtener student o teacher");
            return;
        }
        initOrderStatuses();
        initVisitStatuses();

        initAssignmentTypes();
        initOrigins();
        initNotificationTypes();
    }

    private void initOrderStatuses() {
        createOrderStatusIfNotExists(OrderStatusEnum.PENDING, "Pedido pendiente");
        createOrderStatusIfNotExists(OrderStatusEnum.SENT, "Pedido enviado");
        createOrderStatusIfNotExists(OrderStatusEnum.CANCELLED, "Pedido cancelado");
        createOrderStatusIfNotExists(OrderStatusEnum.REJECTED, "Pedido rechazado");
    }

    private void createOrderStatusIfNotExists(OrderStatusEnum code, String description) {
        if (!orderStatusRepository.existsByCode(code)) {
            OrderStatusEntity st = new OrderStatusEntity();
            st.setCode(code);
            st.setDescription(description);
            st.setIsActive(true);
            orderStatusRepository.save(st);
        }
    }

    private void initVisitStatuses() {
        createVisitStatusIfNotExists(VisitStatusEnum.PLANNED, "Visita planificada");
        createVisitStatusIfNotExists(VisitStatusEnum.CHECKED_IN, "Check-in realizado");
        createVisitStatusIfNotExists(VisitStatusEnum.COMPLETED, "Visita completada");
        createVisitStatusIfNotExists(VisitStatusEnum.SKIPPED, "Visita saltada");
    }

    private void createVisitStatusIfNotExists(VisitStatusEnum code, String description) {
        if (!visitStatusRepository.existsByCode(code)) {
            VisitStatusEntity st = new VisitStatusEntity();
            st.setCode(code);
            st.setDescription(description);
            st.setActive(true);
            visitStatusRepository.save(st);
        }
    }

    private void initAssignmentTypes() {
        createAssignmentTypeIfNotExists(AssignmentTypeEnum.PERMANENT, "Asignación permanente");
        createAssignmentTypeIfNotExists(AssignmentTypeEnum.TEMPORARY, "Asignación temporal");
    }

    private void createAssignmentTypeIfNotExists(AssignmentTypeEnum code, String description) {
        if (!assignmentTypeRepository.existsByCode(code)) {
            AssignmentTypeEntity at = new AssignmentTypeEntity();
            at.setCode(code);
            at.setDescription(description);
            at.setIsActive(true);
            assignmentTypeRepository.save(at);
        }
    }

    private void initOrigins() {
        createOriginIfNotExists(OriginEnum.ONLINE, "Creado online");
        createOriginIfNotExists(OriginEnum.OFFLINE, "Creado offline");
    }

    private void createOriginIfNotExists(OriginEnum code, String description) {
        if (!originRepository.existsByCode(code)) {
            OriginEntity origin = new OriginEntity();
            origin.setCode(code);
            origin.setDescription(description);
            origin.setIsActive(true);
            originRepository.save(origin);
        }
    }

    private void initNotificationTypes() {
        createNotificationTypeIfNotExists(
                NotificationTypeEnum.NEW_ORDER_SENT,
                "Nuevo pedido enviado"
        );
        createNotificationTypeIfNotExists(
                NotificationTypeEnum.TEMP_ASSIGNMENT_CREATED,
                "Asignación temporal creada"
        );
    }

    private void createNotificationTypeIfNotExists(NotificationTypeEnum code, String description) {
        if (!notificationTypeRepository.existsByCode(code)) {
            NotificationTypeEntity nt = new NotificationTypeEntity();
            nt.setCode(code);
            nt.setDescription(description);
            nt.setIsActive(true);
            notificationTypeRepository.save(nt);
        }
    }

}
