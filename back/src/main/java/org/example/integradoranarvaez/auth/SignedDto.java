package org.example.integradoranarvaez.auth;


import org.example.integradoranarvaez.user.model.UserEntity;

public class SignedDto {
    private String token;
    private String tokenType = "Bearer";
    private UserEntity user;

    public SignedDto(String token, UserEntity user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }
}
