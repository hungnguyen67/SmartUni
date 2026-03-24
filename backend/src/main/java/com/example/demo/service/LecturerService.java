package com.example.demo.service;

import com.example.demo.dto.LecturerDTO;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LecturerService {

    @Autowired
    private LecturerProfileRepository lecturerProfileRepository;

    @Autowired
    private AdministrativeClassRepository administrativeClassRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    public List<LecturerDTO> getAllLecturers(String searchTerm, Long facultyId) {
        List<LecturerProfile> lecturers = lecturerProfileRepository.searchLecturers(searchTerm, facultyId);
        return lecturers.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Transactional
    public LecturerDTO createLecturer(LecturerDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(dto.getEmail());
                    newUser.setAccountStatus(User.AccountStatus.ACTIVE);
                    newUser.setCreatedAt(LocalDateTime.now());
                    
                    Role lecturerRole = roleRepository.findByName("LECTURER")
                            .orElseThrow(() -> new RuntimeException("Role LECTURER not found"));
                    newUser.setRole(lecturerRole);
                    return newUser;
                });

        updateUserFields(user, dto);
        userRepository.save(user);

        LecturerProfile profile = new LecturerProfile();
        profile.setUser(user);
        updateProfileFields(profile, dto);
        profile.setCreatedAt(LocalDateTime.now());
        
        lecturerProfileRepository.save(profile);
        return convertToDTO(profile);
    }

    @Transactional
    public LecturerDTO updateLecturer(Long id, LecturerDTO dto) {
        LecturerProfile profile = lecturerProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
        
        User user = profile.getUser();
        updateUserFields(user, dto);
        userRepository.save(user);

        updateProfileFields(profile, dto);
        lecturerProfileRepository.save(profile);
        
        return convertToDTO(profile);
    }

    @Transactional
    public void deleteLecturer(Long id) {
        LecturerProfile profile = lecturerProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));
        User user = profile.getUser();
        
        // Clear advisor from administrative classes
        List<AdministrativeClass> adminClasses = administrativeClassRepository.findByAdvisorUserId(id);
        for (AdministrativeClass ac : adminClasses) {
            ac.setAdvisor(null);
            administrativeClassRepository.save(ac);
        }

        // Clear lecturer from course classes
        List<CourseClass> courseClasses = courseClassRepository.findByLecturerUserId(id);
        for (CourseClass cc : courseClasses) {
            cc.setLecturer(null);
            courseClassRepository.save(cc);
        }

        lecturerProfileRepository.delete(profile);
        userRepository.delete(user);
    }

    private void updateUserFields(User user, LecturerDTO dto) {
        user.setLastName(dto.getLastName() != null ? dto.getLastName() : "");
        user.setFirstName(dto.getFirstName() != null ? dto.getFirstName() : "");
        user.setPhone(dto.getPhone());
        user.setBirthday(dto.getBirthday());
        user.setAddress(dto.getAddress());
        if (dto.getGender() != null) {
            user.setGender(User.Gender.valueOf(dto.getGender()));
        }
        user.setUpdatedAt(LocalDateTime.now());
    }

    private void updateProfileFields(LecturerProfile profile, LecturerDTO dto) {
        profile.setLecturerCode(dto.getLecturerCode());
        profile.setSpecialization(dto.getSpecialization());
        profile.setDegree(dto.getDegree());
        profile.setAcademicRank(dto.getAcademicRank());
        
        if (dto.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));
            profile.setFaculty(faculty);
        }

        if (dto.getStatus() != null) {
            profile.setStatus(LecturerProfile.Status.valueOf(dto.getStatus()));
        }
        profile.setUpdatedAt(LocalDateTime.now());
    }

    private LecturerDTO convertToDTO(LecturerProfile lecturer) {
        LecturerDTO dto = new LecturerDTO();
        dto.setId(lecturer.getUserId());
        dto.setLecturerCode(lecturer.getLecturerCode());
        dto.setLastName(lecturer.getUser().getLastName());
        dto.setFirstName(lecturer.getUser().getFirstName());
        dto.setEmail(lecturer.getUser().getEmail());
        dto.setFacultyId(lecturer.getFaculty() != null ? lecturer.getFaculty().getId() : null);
        dto.setFacultyName(lecturer.getFaculty() != null ? lecturer.getFaculty().getFacultyName() : null);
        dto.setSpecialization(lecturer.getSpecialization());
        dto.setDegree(lecturer.getDegree());
        dto.setAcademicRank(lecturer.getAcademicRank());
        dto.setPhone(lecturer.getUser().getPhone());
        dto.setBirthday(lecturer.getUser().getBirthday());
        dto.setAddress(lecturer.getUser().getAddress());
        dto.setGender(lecturer.getUser().getGender() != null ? lecturer.getUser().getGender().name() : null);
        dto.setStatus(lecturer.getStatus() != null ? lecturer.getStatus().name() : null);
        dto.setCreatedAt(lecturer.getCreatedAt());
        dto.setUpdatedAt(lecturer.getUpdatedAt());
        
        List<AdministrativeClass> classes = administrativeClassRepository.findByAdvisorUserId(lecturer.getUserId());
        dto.setAdvisorClasses(classes.stream()
                .map(AdministrativeClass::getClassCode)
                .collect(Collectors.toList()));
        
        return dto;
    }
}
