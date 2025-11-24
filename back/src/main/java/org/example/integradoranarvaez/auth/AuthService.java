package org.example.integradoranarvaez.auth;


import org.example.integradoranarvaez.security.token.JwtProvider;
import org.example.integradoranarvaez.user.model.UserDTO;
import org.example.integradoranarvaez.user.model.UserEntity;
import org.example.integradoranarvaez.user.model.UserRepository;
import org.example.integradoranarvaez.user.model.UserService;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.utils.TypesResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final AuthenticationManager manager;

    private final UserRepository repository;

    private final JwtProvider jwtProvider;

    private final UserService userService;

    @Autowired
    public AuthService(AuthenticationManager manager, UserRepository repository, JwtProvider jwtProvider, UserService userService) {
        this.manager = manager;
        this.repository = repository;
        this.jwtProvider = jwtProvider;
        this.userService = userService;
    }

    public ResponseEntity<?> login(LoginDto dto) {
        Optional<UserEntity> optionalUser = repository.findByEmail(dto.getEmail());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Message("Correo o contraseña inválidos", TypesResponse.ERROR));
        }

        UserEntity user = optionalUser.get();

        if (user.getLockTime() != null && user.getLockTime().isAfter(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new Message("Cuenta bloqueada hasta " + user.getLockTime(), TypesResponse.ERROR));
        }

        try {
            Authentication auth = manager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
            );

            //Optional<UserEntity> optionalUser = repository.findByEmail(dto.getEmail());
            log.debug("Usuario consultado: {}", optionalUser);
            user.setFailedAttempts(0);
            user.setLockTime(null);
            repository.save(user);

            if (optionalUser.isEmpty() || !optionalUser.get().getStatusActive()) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new Message("Usuario no encontrado o inactivo", TypesResponse.WARNING));
            }


            // UserEntity user = optionalUser.get();
            String token = jwtProvider.generateToken(auth);

            log.info("LOGIN SUCCESS for {}", dto.getEmail());
            return ResponseEntity.ok(new SignedDto(token, user));

        } catch (DisabledException ex) {
            log.warn("LOGIN FAILED for {}", dto.getEmail());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Message("El usuario está deshabilitado", TypesResponse.WARNING));

        } catch (BadCredentialsException ex) {
            log.warn("LOGIN FAILED for {}", dto.getEmail());
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);

            if (attempts >= 3) {
                user.setLockTime(LocalDateTime.now().plusMinutes(30));
            }

            repository.save(user);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new Message("Correo o contraseña inválidos", TypesResponse.ERROR));

        } catch (Exception e) {
            log.error("LOGIN ERROR {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas");
        }
    }

    public ResponseEntity<?> register(UserDTO dto) {
        if (repository.existsByEmail(dto.getEmail()))
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Correo ya existe");


        return userService.saveUserWithRole(dto, dto.getRole());
    }
}