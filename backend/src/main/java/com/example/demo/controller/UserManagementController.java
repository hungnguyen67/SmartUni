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

    @Autowired
    private com.example.demo.repository.StudentProfileRepository studentProfileRepository;

    @Autowired
    private com.example.demo.repository.LecturerProfileRepository lecturerProfileRepository;

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

                        if (user.getRole() != null) {
                            String rName = user.getRole().getName();
                            if ("STUDENT".equalsIgnoreCase(rName) || "ROLE_STUDENT".equalsIgnoreCase(rName)) {
                                studentProfileRepository.findById(user.getId()).ifPresent(p -> {
                                    userMap.put("userCode", p.getStudentCode());
                                    userMap.put("enrollmentYear", p.getEnrollmentYear());
                                    if (p.getAdministrativeClass() != null) {
                                        userMap.put("className", p.getAdministrativeClass().getClassName());
                                        userMap.put("classId", p.getAdministrativeClass().getId());
                                    }
                                    if (p.getCurriculum() != null) {
                                        userMap.put("curriculumName", p.getCurriculum().getCurriculumName());
                                        userMap.put("curriculumId", p.getCurriculum().getId());
                                    }
                                });
                            } else if ("LECTURER".equalsIgnoreCase(rName) || "ROLE_LECTURER".equalsIgnoreCase(rName)) {
                                lecturerProfileRepository.findById(user.getId()).ifPresent(p -> {
                                    userMap.put("userCode", p.getLecturerCode());
                                    userMap.put("degree", p.getDegree());
                                    userMap.put("academicRank", p.getAcademicRank());
                                    userMap.put("specialization", p.getSpecialization());
                                    if (p.getFaculty() != null) {
                                        userMap.put("facultyName", p.getFaculty().getFacultyName());
                                    }
                                });
                            }
                        }

                        userMap.put("email", user.getEmail());
                        userMap.put("name", user.getFullName());
                        userMap.put("firstName", user.getFirstName());
                        userMap.put("lastName", user.getLastName());
                        userMap.put("role", (user.getRole() != null) ? user.getRole().getName() : "Chưa cấp quyền");
                        userMap.put("roleId", (user.getRole() != null) ? user.getRole().getId() : null);
                        userMap.put("enabled", user.getAccountStatus() == User.AccountStatus.ACTIVE);
                        userMap.put("accountStatus", user.getAccountStatus());
                        userMap.put("phone", user.getPhone());
                        userMap.put("gender", user.getGender());
                        userMap.put("birthday", user.getBirthday());
                        userMap.put("isEmailVerified", user.getIsEmailVerified());
                        userMap.put("avatar", user.getAvatar());
                        userMap.putIfAbsent("facultyName", user.getFacultyName()); // Keep for compatibility if used elsewhere
                        userMap.put("lastLogin", user.getLastLogin());
                        userMap.put("createdAt", user.getCreatedAt());
                        userMap.put("address", user.getAddress());
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

    @Autowired
    private com.example.demo.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @DeleteMapping("/users/{id}")
    @org.springframework.transaction.annotation.Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            if (studentProfileRepository.existsById(id)) {
                studentProfileRepository.deleteById(id);
            }
            if (lecturerProfileRepository.existsById(id)) {
                lecturerProfileRepository.deleteById(id);
            }

            passwordResetTokenRepository.deleteByUser(user);

            userRepository.delete(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Xóa tài khoản và hồ sơ liên quan thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi xóa người dùng: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @Autowired
    private com.example.demo.repository.FacultyRepository facultyRepository;

    @Autowired
    private com.example.demo.repository.AdministrativeClassRepository administrativeClassRepository;

    @Autowired
    private com.example.demo.repository.CurriculumRepository curriculumRepository;

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> inviteUser(@RequestBody Map<String, Object> userData) {
        try {
            String email = (String) userData.get("email");
            String roleName = (String) userData.get("role");

            if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email không đúng định dạng!"));
            }

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email này đã tồn tại trong hệ thống!"));
            }

            User user = new User();
            user.setEmail(email);
            user.setLastName((String) userData.get("lastName"));
            user.setFirstName((String) userData.get("firstName"));
            user.setPhone((String) userData.get("phone"));
            user.setAddress((String) userData.get("address"));

            if (userData.get("gender") != null) {
                user.setGender(User.Gender.valueOf((String) userData.get("gender")));
            }
            if (userData.get("birthday") != null && !((String) userData.get("birthday")).isEmpty()) {
                user.setBirthday(java.time.LocalDate.parse((String) userData.get("birthday")));
            }
            if (userData.get("accountStatus") != null) {
                user.setAccountStatus(User.AccountStatus.valueOf((String) userData.get("accountStatus")));
            } else {
                user.setAccountStatus(User.AccountStatus.ACTIVE);
            }

            user.setPassword(passwordEncoder.encode("Abc123"));
            user.setIsEmailVerified(true);
            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setUpdatedAt(java.time.LocalDateTime.now());

            String fullName = user.getLastName() + " " + user.getFirstName();
            user.setAvatar("https://ui-avatars.com/api/?name="
                    + java.net.URLEncoder.encode(fullName, "UTF-8")
                    + "&background=0D8ABC&color=fff&size=200");

            Role role = roleRepository.findByName(roleName.toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Vai trò không tồn tại"));
            user.setRole(role);

            User savedUser = userRepository.save(user);

            if ("STUDENT".equalsIgnoreCase(roleName)) {
                com.example.demo.model.StudentProfile profile = new com.example.demo.model.StudentProfile();
                profile.setUser(savedUser);
                profile.setStudentCode((String) userData.get("userCode"));

                if (userData.get("enrollmentYear") != null && !userData.get("enrollmentYear").toString().isEmpty()) {
                    profile.setEnrollmentYear(Integer.parseInt(userData.get("enrollmentYear").toString()));
                }

                if (userData.get("className") != null) {
                    administrativeClassRepository.findByClassName((String) userData.get("className"))
                            .or(() -> administrativeClassRepository.findByClassCode((String) userData.get("className")))
                            .ifPresent(profile::setAdministrativeClass);
                }

                if (userData.get("curriculumName") != null) {
                    curriculumRepository.findByCurriculumName((String) userData.get("curriculumName"))
                            .ifPresent(profile::setCurriculum);
                }

                profile.setStatus(com.example.demo.model.StudentProfile.Status.STUDYING);
                studentProfileRepository.save(profile);

            } else if ("LECTURER".equalsIgnoreCase(roleName)) {
                com.example.demo.model.LecturerProfile profile = new com.example.demo.model.LecturerProfile();
                profile.setUser(savedUser);
                profile.setLecturerCode((String) userData.get("userCode"));
                profile.setDegree((String) userData.get("degree"));
                profile.setAcademicRank((String) userData.get("academicRank"));
                profile.setSpecialization((String) userData.get("specialization"));

                if (userData.get("facultyName") != null) {
                    facultyRepository.findByFacultyName((String) userData.get("facultyName"))
                            .ifPresent(profile::setFaculty);
                }

                profile.setStatus(com.example.demo.model.LecturerProfile.Status.WORKING);
                lecturerProfileRepository.save(profile);
            }

            try {
                emailService.sendInvitationEmail(email, fullName, "Abc123");
            } catch (Exception e) {
                System.err.println("Gửi mail lỗi: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of("message", "Đã mời người dùng và tạo hồ sơ thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updateData) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

            if (updateData.containsKey("firstName")) {
                user.setFirstName((String) updateData.get("firstName"));
            }
            if (updateData.containsKey("lastName")) {
                user.setLastName((String) updateData.get("lastName"));
            }
            if (updateData.containsKey("phone")) {
                user.setPhone((String) updateData.get("phone"));
            }
            if (updateData.containsKey("address")) {
                user.setAddress((String) updateData.get("address"));
            }
            if (updateData.containsKey("gender") && updateData.get("gender") != null) {
                user.setGender(User.Gender.valueOf((String) updateData.get("gender")));
            }
            if (updateData.containsKey("birthday") && updateData.get("birthday") != null) {
                user.setBirthday(java.time.LocalDate.parse((String) updateData.get("birthday")));
            }
            if (updateData.containsKey("accountStatus") && updateData.get("accountStatus") != null) {
                user.setAccountStatus(User.AccountStatus.valueOf((String) updateData.get("accountStatus")));
            }
            if (updateData.containsKey("roleId") && updateData.get("roleId") != null) {
                Long roleId = Long.parseLong(updateData.get("roleId").toString());
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Vai trò không tồn tại"));
                user.setRole(role);
            }

            userRepository.save(user);

            // Update Profile based on Role
            String roleName = user.getRole().getName();
            if ("STUDENT".equalsIgnoreCase(roleName) || "ROLE_STUDENT".equalsIgnoreCase(roleName)) {
                studentProfileRepository.findById(id).ifPresent(p -> {
                    if (updateData.containsKey("userCode")) p.setStudentCode((String) updateData.get("userCode"));
                    if (updateData.containsKey("enrollmentYear")) {
                        p.setEnrollmentYear(Integer.parseInt(updateData.get("enrollmentYear").toString()));
                    }
                    if (updateData.containsKey("className")) {
                        administrativeClassRepository.findByClassName((String) updateData.get("className"))
                                .or(() -> administrativeClassRepository.findByClassCode((String) updateData.get("className")))
                                .ifPresent(p::setAdministrativeClass);
                    }
                    if (updateData.containsKey("curriculumName")) {
                        curriculumRepository.findByCurriculumName((String) updateData.get("curriculumName"))
                                .ifPresent(p::setCurriculum);
                    }
                    studentProfileRepository.save(p);
                });
            } else if ("LECTURER".equalsIgnoreCase(roleName) || "ROLE_LECTURER".equalsIgnoreCase(roleName)) {
                lecturerProfileRepository.findById(id).ifPresent(p -> {
                    if (updateData.containsKey("userCode")) p.setLecturerCode((String) updateData.get("userCode"));
                    if (updateData.containsKey("degree")) p.setDegree((String) updateData.get("degree"));
                    if (updateData.containsKey("academicRank")) p.setAcademicRank((String) updateData.get("academicRank"));
                    if (updateData.containsKey("specialization")) p.setSpecialization((String) updateData.get("specialization"));
                    if (updateData.containsKey("facultyName")) {
                        facultyRepository.findByFacultyName((String) updateData.get("facultyName"))
                                .ifPresent(p::setFaculty);
                    }
                    lecturerProfileRepository.save(p);
                });
            }

            return ResponseEntity.ok(Map.of("message", "Cập nhật tài khoản và hồ sơ thành công!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi: " + e.getMessage()));
        }
    }
}
