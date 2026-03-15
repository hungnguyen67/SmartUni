package com.example.demo.service;

import com.example.demo.dto.StudentDTO;
import com.example.demo.model.StudentProfile;
import com.example.demo.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudentService {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

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

    private StudentDTO convertToDTO(StudentProfile student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getUserId());
        dto.setStudentCode(student.getStudentCode());
        dto.setFullName(student.getUser().getFullName());
        
        if (student.getAdministrativeClass() != null) {
            dto.setClassName(student.getAdministrativeClass().getClassCode());
            dto.setClassId(student.getAdministrativeClass().getId());
            if (student.getAdministrativeClass().getMajor() != null) {
                dto.setMajorName(student.getAdministrativeClass().getMajor().getMajorName());
            }
        }
        
        if (dto.getMajorName() == null && student.getCurriculum() != null && student.getCurriculum().getMajor() != null) {
            dto.setMajorName(student.getCurriculum().getMajor().getMajorName());
        }
        
        if (student.getCurriculum() != null) {
            dto.setCurriculumId(student.getCurriculum().getId());
            dto.setCurriculumName(student.getCurriculum().getCurriculumName());
        }
        
        dto.setEnrollmentYear(student.getEnrollmentYear());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setTotalCreditsEarned(student.getTotalCreditsEarned());
        dto.setCurrentGpa(student.getCurrentGpa());
        dto.setCurrentGpa10(student.getCurrentGpa10());
        dto.setStatus(student.getStatus() != null ? student.getStatus().name() : null);
        dto.setCreatedAt(student.getCreatedAt());
        dto.setUpdatedAt(student.getUpdatedAt());
        
        return dto;
    }
}
