package org.example.integradoranarvaez.security.token;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.integradoranarvaez.security.MainSecurity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthentication extends OncePerRequestFilter {

    @Autowired
    private JwtProvider provider;

    @Autowired
    private UserDetailsService service;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Rutas públicas
        for (String publicRoute : MainSecurity.getWHITE_LIST()) {
            String pattern = publicRoute.replace("**", ".*");
            if (path.matches(pattern)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        try {
            String token = provider.resolveToken(request);

            if (token != null) {
                Claims claims = provider.resolveClaims(request);

                if (claims != null && provider.validateClaims(claims, token)) {

                    String username = claims.getSubject();

                    // === LOG obligatorio para confirmar que SÍ entra aquí ===
                    System.out.println(">> JWT FILTER: claims OK, username=" + username);

                    // Obtener roles (pueden venir como null)
                    List<String> roles = claims.get("roles", List.class);

                    System.out.println(">> JWT FILTER: roles en token = " + roles);

                    if (roles == null) {
                        System.out.println(">> JWT FILTER: roles es null, asignando lista vacía");
                        roles = List.of();
                    }

                    UserDetails user = service.loadUserByUsername(username);

                    // Convertir roles a GrantedAuthority
                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(role -> {
                                if (!role.startsWith("ROLE_")) {
                                    return new SimpleGrantedAuthority("ROLE_" + role);
                                }
                                return new SimpleGrantedAuthority(role);
                            })
                            .toList();

                    System.out.println(">> JWT FILTER: Authorities finales = " + authorities);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(user, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(auth);

                    System.out.println(">> JWT FILTER: Autenticado correctamente!");
                }


            }
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Token inválido");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
