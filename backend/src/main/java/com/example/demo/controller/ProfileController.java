package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.example.demo.repository.StudentProfileRepository studentProfileRepository;

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", user.getLastName() + " " + user.getFirstName());
            profile.put("email", user.getEmail());
            profile.put("avatar", user.getAvatar());
            profile.put("phone", user.getPhone());
            profile.put("address", user.getAddress());

            Optional<com.example.demo.model.StudentProfile> studentOpt = studentProfileRepository.findById(user.getId());
            if (studentOpt.isPresent()) {
                com.example.demo.model.StudentProfile student = studentOpt.get();
                profile.put("studentCode", student.getStudentCode());
                if (student.getCurriculum() != null) {
                    profile.put("curriculumId", student.getCurriculum().getId());
                    profile.put("curriculumName", student.getCurriculum().getCurriculumName());
                }
                if (student.getAdministrativeClass() != null) {
                    profile.put("classId", student.getAdministrativeClass().getId());
                    profile.put("className", student.getAdministrativeClass().getClassName());
                    if (student.getAdministrativeClass().getMajor() != null) {
                        profile.put("majorName", student.getAdministrativeClass().getMajor().getMajorName());
                    }
                }
            }
            return ResponseEntity.ok(profile);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (updates.containsKey("name")) {
                String fullName = updates.get("name");
                String[] parts = fullName.trim().split("\\s+", 2);
                user.setLastName(parts[0]);
                user.setFirstName(parts.length > 1 ? parts[1] : "");
            }
            if (updates.containsKey("phone")) {
                user.setPhone(updates.get("phone"));
            }
            if (updates.containsKey("address")) {
                user.setAddress(updates.get("address"));
            }

            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Cập nhật hồ sơ thành công"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> passwordData, Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String oldPassword = passwordData.get("oldPassword");
            String newPassword = passwordData.get("newPassword");
            String confirmPassword = passwordData.get("confirmPassword");

            if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu cũ không chính xác"));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Thay đổi mật khẩu thành công"));
        }
        return ResponseEntity.notFound().build();
    }
}
