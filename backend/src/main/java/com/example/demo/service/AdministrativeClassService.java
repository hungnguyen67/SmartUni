package com.example.demo.service;

import com.example.demo.dto.AdministrativeClassDTO;
import com.example.demo.model.AdministrativeClass;
import com.example.demo.repository.AdministrativeClassRepository;
import com.example.demo.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdministrativeClassService {

    @Autowired
    private AdministrativeClassRepository administrativeClassRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    public List<AdministrativeClassDTO> getAllClasses() {
        return administrativeClassRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AdministrativeClassDTO> getClassesByAdvisor(Long userId) {
        return administrativeClassRepository.findByAdvisorUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private AdministrativeClassDTO convertToDTO(AdministrativeClass clazz) {
        AdministrativeClassDTO dto = new AdministrativeClassDTO();
        dto.setId(clazz.getId());
        dto.setClassCode(clazz.getClassCode());
        dto.setClassName(clazz.getClassName());
        
        if (clazz.getMajor() != null) {
            dto.setMajorId(clazz.getMajor().getId());
            dto.setMajorCode(clazz.getMajor().getMajorCode());
            dto.setMajorName(clazz.getMajor().getMajorName());
        }

        if (clazz.getCurriculum() != null) {
            dto.setCurriculumId(clazz.getCurriculum().getId());
            dto.setCurriculumName(clazz.getCurriculum().getCurriculumName());
        }
        
        dto.setAcademicYear(clazz.getAcademicYear());
        dto.setCohort(clazz.getCohort());
        
        if (clazz.getAdvisor() != null) {
            dto.setAdvisorId(clazz.getAdvisor().getUserId());
            dto.setAdvisorName(clazz.getAdvisor().getUser().getLastName() + " " + clazz.getAdvisor().getUser().getFirstName());
        }
        
        dto.setStatus(clazz.getStatus() != null ? clazz.getStatus().name() : "ACTIVE");
        dto.setStudentCount(studentProfileRepository.countByAdministrativeClassId(clazz.getId()));
        dto.setAverageGpa(studentProfileRepository.findAverageGpaByClassId(clazz.getId()));
        dto.setCreatedAt(clazz.getCreatedAt());
        dto.setUpdatedAt(clazz.getUpdatedAt());
        
        return dto;
    }
}
