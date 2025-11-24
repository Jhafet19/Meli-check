package org.example.integradoranarvaez.utils;

import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
public class APIResponse {
    private String message;
    private Object data;
    private boolean error;
    private HttpStatus status;

    public APIResponse(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public APIResponse(String message, Object data, HttpStatus status) {
        this.message = message;
        this.data = data;
        this.status = status;
    }

    public APIResponse(String message, boolean error, HttpStatus status) {
        this.message = message;
        this.error = error;
        this.status = status;
    }
}
