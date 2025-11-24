package org.example.integradoranarvaez.config;

import org.example.integradoranarvaez.model.RoleEntity;
import org.example.integradoranarvaez.model.RoleEnum;
import org.example.integradoranarvaez.model.RoleRepository;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@Component
public class DataInitializer implements CommandLineRunner{

    public static final String ROOT_ADMIN_EMAIL = "admin@gmail.com";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String IMAGE_BASE_PATH = "uploads/courses/";
    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;

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
                    "admin@gmail.com", "0123456789",passwordEncoder.encode("1234"),
                    true,
                    roleRepository.findByRoleEnum(RoleEnum.ADMIN).get()
            );
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmail("dealer@gmail.com")) {
            UserEntity student = new UserEntity(
                    "dealer", "Test", "User","dealer@gmail.com",
                    "0123456789", passwordEncoder.encode("1234"),
                    true,
                    roleRepository.findByRoleEnum(RoleEnum.DEALER).get()
            );
            userRepository.save(student);
        }


        UserEntity student = userRepository.findByEmail("dealer@gmail.com").orElse(null);

        // Validar que no sean null
        if (student == null ) {
            System.err.println("No se pudieron obtener student o teacher");
            return;
        }

    }

}
