package com.example.demo.service;

import com.example.demo.model.CourseClass;
import com.example.demo.model.CourseRegistration;
import com.example.demo.model.StudentProfile;
import com.example.demo.repository.CourseClassRepository;
import com.example.demo.repository.CourseRegistrationRepository;
import com.example.demo.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseRegistrationService {

    @Autowired
    private CourseRegistrationRepository registrationRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    public List<com.example.demo.dto.CourseRegistrationDTO> getRegistrationsByStudent(Long studentId) {
        return registrationRepository.findByStudentUserId(studentId)
                .stream().map(this::convertToDTO).collect(java.util.stream.Collectors.toList());
    }

    public List<com.example.demo.dto.CourseRegistrationDTO> getRegistrationsByStudentAndSemester(Long studentId, Long semesterId) {
        return registrationRepository.findByStudentUserIdAndCourseClassSemesterId(studentId, semesterId)
                .stream().map(this::convertToDTO).collect(java.util.stream.Collectors.toList());
    }

    private com.example.demo.dto.CourseRegistrationDTO convertToDTO(CourseRegistration reg) {
        com.example.demo.dto.CourseRegistrationDTO dto = new com.example.demo.dto.CourseRegistrationDTO();
        dto.setId(reg.getId());
        dto.setEnrollmentDate(reg.getEnrollmentDate());
        dto.setStatus(reg.getStatus().name());
        dto.setTotalScore(reg.getTotalScore());
        dto.setGradeLetter(reg.getGradeLetter());
        dto.setGradePoint(reg.getGradePoint());
        
        if (reg.getCourseClass() != null) {
            dto.setClassId(reg.getCourseClass().getId());
            dto.setClassCode(reg.getCourseClass().getClassCode());
            if (reg.getCourseClass().getSubject() != null) {
                dto.setSubjectName(reg.getCourseClass().getSubject().getName());
                dto.setCredits(reg.getCourseClass().getSubject().getCredits());
            }
        }
        
        if (reg.getStudent() != null) {
            dto.setStudentId(reg.getStudent().getUserId());
            if (reg.getStudent().getUser() != null) {
                dto.setStudentName(reg.getStudent().getUser().getFullName());
            }
        }
        
        return dto;
    }

    @Transactional
    public com.example.demo.dto.CourseRegistrationDTO register(Long studentId, Long classId) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course class not found"));

        if (!cc.getAllowRegister()) {
            throw new RuntimeException("Class is not open for registration");
        }

        if (cc.getCurrentEnrolled() >= cc.getMaxStudents()) {
            throw new RuntimeException("Class is full");
        }

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        if (registrationRepository.findByCourseClassIdAndStudentUserId(classId, studentId).isPresent()) {
            throw new RuntimeException("Already registered for this class");
        }

        CourseRegistration reg = new CourseRegistration();
        reg.setStudent(student);
        reg.setCourseClass(cc);
        reg.setStatus(CourseRegistration.RegistrationStatus.REGISTERED);

        cc.setCurrentEnrolled(cc.getCurrentEnrolled() + 1);
        courseClassRepository.save(cc);

        return convertToDTO(registrationRepository.save(reg));
    }

    @Transactional
    public void drop(Long registrationId) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        CourseClass cc = reg.getCourseClass();
        cc.setCurrentEnrolled(Math.max(0, cc.getCurrentEnrolled() - 1));
        courseClassRepository.save(cc);

        registrationRepository.delete(reg);
    }
}
