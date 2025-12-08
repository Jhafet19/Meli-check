package org.example.integradoranarvaez.user.control;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.example.integradoranarvaez.user.model.ChangePasswordDTO;
import org.example.integradoranarvaez.user.model.UserDTO;
import org.example.integradoranarvaez.user.model.UserService;
import org.example.integradoranarvaez.utils.Message;
import org.example.integradoranarvaez.validation.ValidationGroups;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

//    @PostMapping("/register/student")
//    public ResponseEntity<Message> registerStudent(@RequestBody UserDTO dto) {
//        return userService.saveUserWithRole(dto, "STUDENT");
//    }


    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<Message> getAllUsers() {
        return userService.findAll();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/profile")
    public ResponseEntity<Message> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.getUserProfileByEmail(email);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/password")
    public ResponseEntity<Message> updatePassword(@Valid @RequestBody ChangePasswordDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userService.updatePassword(email, dto.getNewPassword());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all-teacher")
    public ResponseEntity<Message> getAllTeacher() {
        return userService.findByRol("TEACHER");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all-student")
    public ResponseEntity<Message> getAllStudents() {
        return userService.findByRol("STUDENT");
    }

    /// Cosas Nuevas

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/dealer")
    public ResponseEntity<Message> createDealer(
            @Validated(ValidationGroups.OnCreate.class) @RequestBody UserDTO dto) {
        return userService.createDealer(dto);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin")
    public ResponseEntity<Message> createAdmin(@Valid @RequestBody UserDTO dto) {

        log.info("==> [POST /admin] Entrando. Request para crear ADMIN con email {}", dto.getEmail());
        ResponseEntity<Message> response = userService.createAdmin(dto);
        log.info("<== [POST /admin] Terminando. Status: {}", response.getStatusCode());

        return response;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("")
    public ResponseEntity<Message> getAll() {

        log.info("==> [GET /] Entrando. Solicitando listado completo de usuarios");
        ResponseEntity<Message> response = userService.findAll();
        log.info("<== [GET /] Terminando. Total usuarios: {}",
                ((List<?>) response.getBody().getResult()).size());

        return response;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dealers")
    public ResponseEntity<Message> getDealers() {

        log.info("==> [GET /dealers] Entrando. Solicitando lista de DEALERS");

        ResponseEntity<Message> response = userService.findAllDealers();

        log.info("<== [GET /dealers] Terminando. Total dealers: {}",
                ((List<?>) response.getBody().getResult()).size());
        return response;
    }

    // @PreAuthorize("isAuthenticated()") Yo digo que hay que usar este
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Message> updateUser(
            @PathVariable Long id,
            @Validated(ValidationGroups.OnUpdate.class) @RequestBody UserDTO dto) {

        log.info("==> [PUT /{}] Entrando. Actualizar usuario ID {}", id, id);
        ResponseEntity<Message> response = userService.updateUser(id, dto);

        log.info("<== [PUT /{}] Terminando. Status: {}", id, response.getStatusCode());
        return response;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Message> toggleActive(@PathVariable Long id) {

        log.info("==> [PATCH /{}/toggle] Entrando. Toggle active usuario ID {}", id, id);

        ResponseEntity<Message> response = userService.toggleActive(id);

        log.info("<== [PATCH /{}/toggle] Terminando. Status: {}", id, response.getStatusCode());

        return response;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<Message> profile() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("==> [GET /me] Entrando. Solicitando perfil de {}", email);

        ResponseEntity<Message> response = userService.getProfile(email);

        log.info("<== [GET /me] Terminando. Status: {}", response.getStatusCode());

        return response;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<Message> findOne(@PathVariable Long id) {
        return userService.findOneById(id);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/fcm-token")
    public ResponseEntity<Message> saveFcmToken(@RequestBody java.util.Map<String, String> body) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String fcmToken = body.get("fcmToken");

        log.info("==> [POST /fcm-token] Guardando token FCM para usuario {}", email);
        ResponseEntity<Message> response = userService.saveFcmToken(email, fcmToken);
        log.info("<== [POST /fcm-token] Token guardado. Status: {}", response.getStatusCode());

        return response;
    }




    /*
    *  Quizas despues
    * @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/password")
    public ResponseEntity<Message> updatePassword(@Valid @RequestBody ChangePasswordDTO dto) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        log.info("==> [PUT /me/password] Entrando. Request para cambiar password de {}", email);

        ResponseEntity<Message> response =
                userService.updatePassword(email, dto.getNewPassword());

        log.info("<== [PUT /me/password] Terminando. Status: {}", response.getStatusCode());

        return response;
    }
    *
    * */
}