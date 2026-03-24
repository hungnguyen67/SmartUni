package com.example.demo.service;

import com.example.demo.dto.AdministrativeClassDTO;
import com.example.demo.model.AdministrativeClass;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdministrativeClassService {

    @Autowired
    private AdministrativeClassRepository administrativeClassRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private MajorRepository majorRepository;

    @Autowired
    private LecturerProfileRepository lecturerProfileRepository;

    @Autowired
    private CurriculumRepository curriculumRepository;

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

    @Transactional
    public AdministrativeClassDTO saveClass(AdministrativeClassDTO dto) {
        AdministrativeClass clazz = new AdministrativeClass();
        updateEntityFromDTO(clazz, dto);
        return convertToDTO(administrativeClassRepository.save(clazz));
    }

    @Transactional
    public AdministrativeClassDTO updateClass(Long id, AdministrativeClassDTO dto) {
        AdministrativeClass clazz = administrativeClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        updateEntityFromDTO(clazz, dto);
        return convertToDTO(administrativeClassRepository.save(clazz));
    }

    @Transactional
    public void deleteClass(Long id) {
        administrativeClassRepository.deleteById(id);
    }

    private void updateEntityFromDTO(AdministrativeClass clazz, AdministrativeClassDTO dto) {
        clazz.setClassCode(dto.getClassCode());
        clazz.setClassName(dto.getClassName());
        clazz.setAcademicYear(dto.getAcademicYear());
        clazz.setCohort(dto.getCohort());

        if (dto.getMajorId() != null) {
            clazz.setMajor(majorRepository.findById(dto.getMajorId()).orElse(null));
        }

        if (dto.getAdvisorId() != null) {
            clazz.setAdvisor(lecturerProfileRepository.findById(dto.getAdvisorId()).orElse(null));
        }

        if (dto.getCurriculumId() != null) {
            clazz.setCurriculum(curriculumRepository.findById(dto.getCurriculumId()).orElse(null));
        }

        if (dto.getStatus() != null) {
            try {
                clazz.setStatus(AdministrativeClass.ClassStatus.valueOf(dto.getStatus()));
            } catch (Exception e) {
                clazz.setStatus(AdministrativeClass.ClassStatus.ACTIVE);
            }
        }
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
