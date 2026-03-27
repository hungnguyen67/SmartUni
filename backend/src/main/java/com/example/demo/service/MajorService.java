package com.example.demo.service;

import com.example.demo.dto.MajorDTO;
import com.example.demo.model.Curriculum;
import com.example.demo.model.Major;
import com.example.demo.repository.CurriculumRepository;
import com.example.demo.repository.MajorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MajorService {

    @Autowired
    private MajorRepository majorRepository;

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private com.example.demo.repository.CurriculumSubjectRepository curriculumSubjectRepository;

    @Autowired
    private com.example.demo.repository.KnowledgeBlockRepository knowledgeBlockRepository;

    @Autowired
    private com.example.demo.repository.FacultyRepository facultyRepository;

    public List<MajorDTO> getAllMajors() {
        return majorRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MajorDTO getMajorById(Long id) {
        Major major = majorRepository.findById(id).orElseThrow(() -> new RuntimeException("Major not found"));
        return convertToDTO(major);
    }

    public MajorDTO createMajor(MajorDTO majorDTO) {
        Major major = new Major();
        major.setMajorCode(majorDTO.getMajorCode());
        major.setMajorName(majorDTO.getMajorName());
        if (majorDTO.getFacultyId() != null) {
            major.setFaculty(facultyRepository.findById(majorDTO.getFacultyId()).orElse(null));
        }
        major.setDescription(majorDTO.getDescription());
        major.setStatus(majorDTO.getStatus() != null ? com.example.demo.model.Major.Status.valueOf(majorDTO.getStatus())
                : com.example.demo.model.Major.Status.ACTIVE);
        Major savedMajor = majorRepository.save(major);
        return convertToDTO(savedMajor);
    }

    public MajorDTO updateMajor(Long id, MajorDTO majorDTO) {
        Major major = majorRepository.findById(id).orElseThrow(() -> new RuntimeException("Major not found"));
        major.setMajorCode(majorDTO.getMajorCode());
        major.setMajorName(majorDTO.getMajorName());
        if (majorDTO.getFacultyId() != null) {
            major.setFaculty(facultyRepository.findById(majorDTO.getFacultyId()).orElse(null));
        }
        major.setDescription(majorDTO.getDescription());
        if (majorDTO.getStatus() != null) {
            major.setStatus(com.example.demo.model.Major.Status.valueOf(majorDTO.getStatus()));
        }
        Major savedMajor = majorRepository.save(major);
        return convertToDTO(savedMajor);
    }

    public void deleteMajor(Long id) {
        majorRepository.deleteById(id);
    }

    private MajorDTO convertToDTO(Major major) {
        List<Curriculum> curriculums = curriculumRepository.findByMajorId(major.getId());
        int numberOfCurriculums = curriculums.size();

        int totalCredits = 0;
        String activeCurriculumName = "-";
        int totalSubjects = 0;
        int totalKnowledgeBlocks = 0;

        if (!curriculums.isEmpty()) {
            curriculums.sort((c1, c2) -> c2.getAppliedYear().compareTo(c1.getAppliedYear()));
            activeCurriculumName = curriculums.get(0).getCurriculumName();

            java.util.Set<Long> uniqueSubjectIds = new java.util.HashSet<>();
            java.util.Set<String> uniqueBlockNames = new java.util.HashSet<>();

            for (Curriculum curriculum : curriculums) {
                List<com.example.demo.model.CurriculumSubject> curriculumSubjects = curriculumSubjectRepository
                        .findByCurriculumId(curriculum.getId());
                for (com.example.demo.model.CurriculumSubject cs : curriculumSubjects) {
                    if (cs.getSubject() != null && !uniqueSubjectIds.contains(cs.getSubject().getId())) {
                        uniqueSubjectIds.add(cs.getSubject().getId());
                        totalCredits += cs.getSubject().getCredits();
                    }
                }
                List<com.example.demo.model.KnowledgeBlock> blocks = knowledgeBlockRepository
                        .findByCurriculumId(curriculum.getId());
                if (blocks != null) {
                    for (com.example.demo.model.KnowledgeBlock b : blocks) {
                        uniqueBlockNames.add(b.getBlockName());
                    }
                }
            }
            totalSubjects = uniqueSubjectIds.size();
            totalKnowledgeBlocks = uniqueBlockNames.size();
        }

        MajorDTO dto = new MajorDTO(
                major.getId(),
                major.getMajorCode(),
                major.getMajorName(),
                major.getFaculty() != null ? major.getFaculty().getId() : null,
                major.getFaculty() != null ? major.getFaculty().getFacultyName() : "-",
                major.getFaculty() != null ? major.getFaculty().getFacultyCode() : "-",
                major.getDescription(),
                numberOfCurriculums,
                totalCredits,
                major.getStatus().name(),
                activeCurriculumName,
                totalSubjects,
                totalKnowledgeBlocks);
        dto.setCreatedAt(major.getCreatedAt());
        dto.setUpdatedAt(major.getUpdatedAt());
        return dto;
    }
}
