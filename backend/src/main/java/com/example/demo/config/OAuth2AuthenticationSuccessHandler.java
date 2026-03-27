package com.example.demo.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Optional;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    private final String jwtSecret = "mySecretKeyForJWTGenerationThatIsLongEnoughForHS256Algorithm";

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        System.out.println("OAuth2 Success Handler called");

        if (authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

            System.out.println("OAuth2User: " + oauth2User);

            String email = oauth2User.getAttribute("email");
            String googleId = oauth2User.getAttribute("sub");
            String name = oauth2User.getAttribute("name");
            String avatar = oauth2User.getAttribute("picture");

            System.out.println("OAuth2 User details - Email: " + email + ", Name: " + name + ", GoogleId: " + googleId);

            Optional<User> existingUser = userRepository.findByGoogleId(googleId);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                user.setLastName(name);
                user.setFirstName("");
                if (avatar != null && !avatar.isEmpty()) {
                    user.setAvatar(avatar);
                }
                System.out.println("Found existing user: " + user.getEmail());
            } else {
                Optional<User> userByEmail = userRepository.findByEmail(email);
                if (userByEmail.isPresent()) {
                    user = userByEmail.get();
                    user.setGoogleId(googleId);
                    user.setLastName(name);
                    user.setFirstName("");
                    if (avatar != null && !avatar.isEmpty()) {
                        user.setAvatar(avatar);
                    }
                    user.setUpdatedAt(LocalDateTime.now());
                    System.out.println("Updated existing user with GoogleId: " + user.getEmail());
                } else {
                    String message = "Tài khoản chưa được kích hoạt";
                    String redirectUrl = "http://localhost:4200/login?error="
                            + java.net.URLEncoder.encode(message, "UTF-8");
                    getRedirectStrategy().sendRedirect(request, response, redirectUrl);
                    return;
                }
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String jwt = Jwts.builder()
                    .setSubject(email)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(getSigningKey())
                    .compact();

            String roleName = (user.getRole() != null) ? user.getRole().getName() : "NONE";
            String message = "Đăng nhập thành công!";
            String userJson = String.format(
                    "{\"id\":%d,\"email\":\"%s\",\"name\":\"%s\",\"avatar\":\"%s\",\"role\":\"%s\"}",
                    user.getId(), user.getEmail(), user.getLastName() + " " + user.getFirstName(),
                    user.getAvatar() != null ? user.getAvatar() : "", roleName);
            String redirectUrl = String.format(
                    "http://localhost:4200/oauth2/redirect?token=%s&role=%s&message=%s&user=%s",
                    jwt, roleName, java.net.URLEncoder.encode(message, "UTF-8"),
                    java.net.URLEncoder.encode(userJson, "UTF-8"));

            System.out.println("Redirecting to: " + redirectUrl);

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            System.out.println("Authentication principal is not OAuth2User");
            getRedirectStrategy().sendRedirect(request, response,
                    "http://localhost:4200/oauth2/redirect?error=auth_failed");
        }
    }
}