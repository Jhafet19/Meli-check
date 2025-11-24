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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

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

        // Evitar el filtro en las rutas públicas
        for (String publicRoute : MainSecurity.getWHITE_LIST()) {
            String routePattern = publicRoute.replace("**", ".*");
            if (path.matches(routePattern)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        try {
            String token = provider.resolveToken(request);
            if (token == null) {
                filterChain.doFilter(request, response);
                return;
            }

            Claims claims = provider.resolveClaims(request);
            if (claims != null && provider.validateClaims(claims, token)) {
                String username = claims.getSubject();
                UserDetails user = service.loadUserByUsername(username);
                Authentication auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            return;
        }

        filterChain.doFilter(request, response);
    }
}
