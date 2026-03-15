package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailService emailService;

    private final String jwtSecret = "mySecretKeyForJWTGenerationThatIsLongEnoughForHS256Algorithm";
    private final long jwtExpirationMs = 86400000;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.get("email"),
                            loginRequest.get("password")
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(loginRequest.get("email"))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            String jwt = generateJwtToken(authentication);

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("message", "Đăng nhập thành công!");
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getFullName());
            userData.put("role", (user.getRole() != null) ? user.getRole().getName() : "Null");
            userData.put("avatar", user.getAvatar());
            response.put("user", userData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Lỗi đăng nhập: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email hoặc mật khẩu không chính xác!"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(request.get("email"));
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of("message", "Nếu email tồn tại, mã sẽ được gửi."));
            }

            User user = userOpt.get();

            passwordResetTokenRepository.deleteByUser(user);

            String codeStr = String.valueOf((int) (Math.random() * 900000) + 100000);
            PasswordResetToken prt = new PasswordResetToken(user, codeStr, PasswordResetToken.TokenType.OTP, LocalDateTime.now().plusMinutes(15));

            passwordResetTokenRepository.save(prt);
            emailService.sendResetCode(user.getEmail(), codeStr);

            return ResponseEntity.ok(Map.of("message", "Mã xác nhận đã được gửi!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi gửi mail: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findByEmail(request.get("email"))
                    .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

            PasswordResetToken prt = passwordResetTokenRepository.findByUserAndToken(user, request.get("code"))
                    .orElseThrow(() -> new RuntimeException("Mã xác nhận không đúng hoặc không tồn tại"));

            if (prt.getExpiryDate().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mã xác nhận đã hết hạn"));
            }

            user.setPassword(passwordEncoder.encode(request.get("password")));
            userRepository.save(user);

            passwordResetTokenRepository.delete(prt);

            return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được đặt lại thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }

    private String generateJwtToken(Authentication authentication) {
        return Jwts.builder()
                .setSubject(authentication.getName())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                .compact();
    }
}
