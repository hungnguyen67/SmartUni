package com.example.demo.service;

import com.example.demo.dto.StudentDTO;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import com.example.demo.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AdministrativeClassRepository administrativeClassRepository;

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<StudentDTO> searchStudents(String searchTerm, Long classId, Long majorId,
            Integer enrollmentYear, String status, Double minGpa, Double maxGpa) {

        StudentProfile.Status profileStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                profileStatus = StudentProfile.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
            }
        }

        List<StudentProfile> students = studentProfileRepository.searchStudents(
                searchTerm, classId, majorId, enrollmentYear, profileStatus, minGpa, maxGpa);

        return students.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<Integer> getDistinctEnrollmentYears() {
        return studentProfileRepository.findDistinctEnrollmentYears();
    }

    @Transactional
    public StudentDTO createStudent(StudentDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ApiException("Email '" + dto.getEmail() + "' đã tồn tại trong hệ thống!", HttpStatus.CONFLICT);
        }

        if (studentProfileRepository.existsByStudentCode(dto.getStudentCode())) {
            throw new ApiException("Mã sinh viên '" + dto.getStudentCode() + "' đã tồn tại!", HttpStatus.CONFLICT);
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setAccountStatus(User.AccountStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());

        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new ApiException("Role STUDENT not found", HttpStatus.INTERNAL_SERVER_ERROR));
        user.setRole(studentRole);

        updateUserFields(user, dto);
        user = userRepository.saveAndFlush(user);

        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        // Hibernate handles userId via @MapsId
        updateProfileFields(profile, dto);
        profile.setCreatedAt(LocalDateTime.now());

        try {
            studentProfileRepository.save(profile);
            return convertToDTO(profile);
        } catch (Exception e) {
            System.err.println("Error saving student profile: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Cause: " + e.getCause().getMessage());
            }
            throw new RuntimeException("Lỗi lưu thông tin sinh viên: " + e.getMessage());
        }
    }


    @Transactional
    public StudentDTO updateStudent(Long id, StudentDTO dto) {
        StudentProfile profile = studentProfileRepository.findById(id)
                .orElseThrow(() -> new ApiException("Student not found with id: " + id, HttpStatus.NOT_FOUND));

        User user = profile.getUser();
        updateUserFields(user, dto);
        userRepository.save(user);

        updateProfileFields(profile, dto);
        try {
            studentProfileRepository.save(profile);
            return convertToDTO(profile);
        } catch (Exception e) {
            System.err.println("Error updating student profile: " + e.getMessage());
            throw new RuntimeException("Lỗi cập nhật sinh viên: " + e.getMessage());
        }
    }


    @Transactional
    public void deleteStudent(Long id) {
        StudentProfile profile = studentProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        User user = profile.getUser();

        studentProfileRepository.delete(profile);
        userRepository.delete(user);
    }

    private void updateUserFields(User user, StudentDTO dto) {
        user.setLastName(dto.getLastName() != null ? dto.getLastName() : "");
        user.setFirstName(dto.getFirstName() != null ? dto.getFirstName() : "");
        user.setPhone(dto.getPhone());
        user.setBirthday(dto.getBirthday());
        user.setAddress(dto.getAddress());
        user.setAvatar(dto.getAvatar());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getIsEmailVerified() != null) {
            user.setIsEmailVerified(dto.getIsEmailVerified());
        }
        if (dto.getGender() != null) {
            user.setGender(User.Gender.valueOf(dto.getGender()));
        }
        user.setUpdatedAt(LocalDateTime.now());
    }

    private void updateProfileFields(StudentProfile profile, StudentDTO dto) {
        profile.setStudentCode(dto.getStudentCode());
        profile.setEnrollmentYear(dto.getEnrollmentYear());

        if (dto.getClassId() != null) {
            AdministrativeClass ac = administrativeClassRepository.findById(dto.getClassId())
                    .orElseThrow(() -> new ApiException("Class not found with id: " + dto.getClassId(),
                            HttpStatus.NOT_FOUND));
            profile.setAdministrativeClass(ac);
        }

        if (dto.getCurriculumId() != null) {
            Curriculum curriculum = curriculumRepository.findById(dto.getCurriculumId())
                    .orElseThrow(() -> new ApiException("Curriculum not found with id: " + dto.getCurriculumId(),
                            HttpStatus.BAD_REQUEST));
            profile.setCurriculum(curriculum);
        }

        if (dto.getStatus() != null) {
            profile.setStatus(StudentProfile.Status.valueOf(dto.getStatus()));
        }
        profile.setUpdatedAt(LocalDateTime.now());
    }

    private StudentDTO convertToDTO(StudentProfile student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getUserId());
        dto.setStudentCode(student.getStudentCode());
        dto.setFullName(student.getUser().getFullName());
        dto.setFirstName(student.getUser().getFirstName());
        dto.setLastName(student.getUser().getLastName());
        dto.setEmail(student.getUser().getEmail());
        dto.setPhone(student.getUser().getPhone());
        dto.setAddress(student.getUser().getAddress());
        dto.setBirthday(student.getUser().getBirthday());
        dto.setGender(student.getUser().getGender() != null ? student.getUser().getGender().name() : null);

        if (student.getAdministrativeClass() != null) {
            dto.setClassName(student.getAdministrativeClass().getClassCode());
            dto.setClassId(student.getAdministrativeClass().getId());
            if (student.getAdministrativeClass().getMajor() != null) {
                dto.setMajorName(student.getAdministrativeClass().getMajor().getMajorName());
                dto.setMajorId(student.getAdministrativeClass().getMajor().getId());
                if (student.getAdministrativeClass().getMajor().getFaculty() != null) {
                    dto.setFacultyId(student.getAdministrativeClass().getMajor().getFaculty().getId());
                    dto.setFacultyName(student.getAdministrativeClass().getMajor().getFaculty().getFacultyName());
                }
            }
        }

        if (dto.getMajorName() == null && student.getCurriculum() != null
                && student.getCurriculum().getMajor() != null) {
            dto.setMajorName(student.getCurriculum().getMajor().getMajorName());
            dto.setMajorId(student.getCurriculum().getMajor().getId());
            if (student.getCurriculum().getMajor().getFaculty() != null) {
                dto.setFacultyId(student.getCurriculum().getMajor().getFaculty().getId());
                dto.setFacultyName(student.getCurriculum().getMajor().getFaculty().getFacultyName());
            }
        }

        if (student.getCurriculum() != null) {
            dto.setCurriculumId(student.getCurriculum().getId());
            dto.setCurriculumName(student.getCurriculum().getCurriculumName());
        }

        dto.setEnrollmentYear(student.getEnrollmentYear());

        dto.setTotalCreditsEarned(student.getTotalCreditsEarned());
        dto.setCurrentGpa(student.getCurrentGpa());
        dto.setCurrentGpa10(student.getCurrentGpa10());
        dto.setStatus(student.getStatus() != null ? student.getStatus().name() : null);
        dto.setCreatedAt(student.getCreatedAt());
        dto.setUpdatedAt(student.getUpdatedAt());

        return dto;
    }
}
