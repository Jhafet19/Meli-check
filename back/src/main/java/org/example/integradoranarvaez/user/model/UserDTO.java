package org.example.integradoranarvaez.user.model;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import org.example.integradoranarvaez.validation.ValidationGroups;

public class UserDTO {
    private Long id;
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$",
            message = "El nombre solo puede contener letras y espacios, entre 2 y 30 caracteres."
    )
    private String name;
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$",
            message = "El apellido paterno solo puede contener letras y espacios, entre 2 y 30 caracteres."
    )
    private String lastName;
    @Pattern(
            regexp = "^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}$",
            message = "El apellido materno solo puede contener letras y espacios, entre 2 y 30 caracteres."
    )
    private String surname;
    @Pattern(
            regexp = "^\\d{10}$",
            message = "El teléfono debe contener exactamente 10 dígitos numéricos."
    )
    private String phone;
    @Email(message = "El correo debe tener un formato válido.")
    private String email;
    @Pattern(
            groups = ValidationGroups.OnCreate.class,
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un símbolo."
    )
    private String password;
    private String role;

    public UserDTO(Long id, String name, String lastName, String surname, String phone, String email, String password, String role) {
        this.id = id;
        this.name = name;
        this.lastName = lastName;
        this.surname = surname;
        this.phone = phone;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public UserDTO(String name, String lastName, String surname, String phone, String email, String password, String role) {
        this.name = name;
        this.lastName = lastName;
        this.surname = surname;
        this.phone = phone;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public UserDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getSurname() {
        return surname;
    }

    public void setSurname(String surname) {
        this.surname = surname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}

