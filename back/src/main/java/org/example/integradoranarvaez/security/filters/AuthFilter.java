package org.example.integradoranarvaez.security.filters;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.integradoranarvaez.security.token.JwtProvider;
import org.example.integradoranarvaez.security.token.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;


import java.io.IOException;

@Component
public class AuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
    HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        System.out.println(">>> AuthFilter ejecutado: " + request.getRequestURI());
        String token = jwtProvider.resolveToken(request);
        System.err.println("token = " + token);
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            if (jwtProvider.validateToken(token)) {
                String email = jwtProvider.getUsernameFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            System.out.println(">>> Error autenticando token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
