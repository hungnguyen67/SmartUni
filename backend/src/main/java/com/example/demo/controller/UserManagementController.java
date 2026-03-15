package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class UserManagementController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRoles() {
        try {
            List<Role> roles = roleRepository.findAll();

            List<Map<String, Object>> roleList = roles.stream()
                    .filter(role -> !role.getName().equalsIgnoreCase("ADMIN"))
                    .map(role -> {
                        Map<String, Object> roleMap = new HashMap<>();
                        roleMap.put("id", role.getId());
                        roleMap.put("name", role.getName());
                        roleMap.put("description", role.getDescription());
                        return roleMap;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("roles", roleList);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsers() {
        try {
            List<User> users = userRepository.findAll();

            List<Map<String, Object>> userList = users.stream()
                    .filter(user -> {
                        if (user.getRole() == null || user.getRole().getName() == null) {
                            return true;
                        }
                        String roleName = user.getRole().getName();
                        return !roleName.equalsIgnoreCase("ADMIN") && !roleName.equalsIgnoreCase("ROLE_ADMIN");
                    })
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", user.getId());
                        userMap.put("email", user.getEmail());
                        userMap.put("name", user.getFullName());
                        userMap.put("role", (user.getRole() != null) ? user.getRole().getName() : "Chưa cấp quyền");
                        userMap.put("enabled", user.getAccountStatus() == User.AccountStatus.ACTIVE);
                        userMap.put("accountStatus", user.getAccountStatus());
                        userMap.put("phone", user.getPhone());
                        userMap.put("gender", user.getGender());
                        userMap.put("isEmailVerified", user.getIsEmailVerified());
                        userMap.put("avatar", user.getAvatar());
                        userMap.put("facultyName", user.getFacultyName());
                        userMap.put("lastLogin", user.getLastLogin());
                        userMap.put("createdAt", user.getCreatedAt());
                        return userMap;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("users", userList);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userRepository.deleteById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Xóa người dùng thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Không thể xóa người dùng: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> inviteUser(@RequestBody Map<String, String> userData) {
        try {
            String email = userData.get("email");
            String roleName = userData.get("role");
            String facultyName = userData.get("facultyName");

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Email này đã tồn tại trong hệ thống. Vui lòng sử dụng email khác!"
                ));
            }

            User user = new User();
            user.setEmail(email);
            user.setFacultyName(facultyName);
            user.setLastName(email.split("@")[0]);
            user.setFirstName("");
            user.setPassword(passwordEncoder.encode("Abc123"));
            user.setAccountStatus(User.AccountStatus.ACTIVE);
            user.setIsEmailVerified(true);

            String defaultName = email.split("@")[0];
            user.setAvatar("https://ui-avatars.com/api/?name="
                    + java.net.URLEncoder.encode(defaultName, "UTF-8")
                    + "&background=0D8ABC&color=fff&size=200");

            Role role = roleRepository.findByName(roleName.toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Vai trò không tồn tại"));
            user.setRole(role);

            userRepository.save(user);

            try {
                emailService.sendInvitationEmail(email, user.getLastName() + " " + user.getFirstName(), "Abc123");
            } catch (Exception e) {
                System.err.println("Gửi mail lỗi: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Hệ thống đã gửi lời mời thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }
}
