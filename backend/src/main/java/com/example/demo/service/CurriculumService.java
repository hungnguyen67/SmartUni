package com.example.demo.service;

import com.example.demo.dto.CurriculumDTO;
import com.example.demo.model.Curriculum;
import com.example.demo.model.Major;
import com.example.demo.repository.CurriculumRepository;
import com.example.demo.repository.MajorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.dto.CurriculumSubjectComponentDTO;
import com.example.demo.dto.KnowledgeBlockDetailDTO;
import com.example.demo.model.CurriculumSubject;
import com.example.demo.model.KnowledgeBlock;
import com.example.demo.model.SubjectEquivalent;
import com.example.demo.model.SubjectPrerequisite;
import com.example.demo.repository.CurriculumSubjectRepository;
import com.example.demo.repository.KnowledgeBlockRepository;
import com.example.demo.repository.SubjectEquivalentRepository;
import com.example.demo.repository.SubjectPrerequisiteRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CurriculumService {

    private static final Logger log = LoggerFactory.getLogger(CurriculumService.class);

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private MajorRepository majorRepository;

    @Autowired
    private KnowledgeBlockRepository knowledgeBlockRepository;

    @Autowired
    private CurriculumSubjectRepository curriculumSubjectRepository;

    @Autowired
    private SubjectPrerequisiteRepository subjectPrerequisiteRepository;

    @Autowired
    private SubjectEquivalentRepository subjectEquivalentRepository;

    public List<CurriculumDTO> getAllCurriculums() {
        return curriculumRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CurriculumDTO> getCurriculumsByMajorId(Long majorId) {
        return curriculumRepository.findByMajorId(majorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CurriculumDTO getCurriculumById(Long id) {
        Curriculum curriculum = curriculumRepository.findById(id).orElseThrow(() -> new RuntimeException("Curriculum not found"));
        return convertToDTO(curriculum);
    }

    public List<KnowledgeBlockDetailDTO> getCurriculumDetails(Long curriculumId) {
        List<KnowledgeBlock> blocks = knowledgeBlockRepository.findByCurriculumId(curriculumId);
        List<CurriculumSubject> curriculumSubjects = curriculumSubjectRepository.findByCurriculumId(curriculumId);
        
        List<Long> subjectIds = curriculumSubjects.stream()
                .map(cs -> cs.getSubject().getId())
                .collect(Collectors.toList());

        List<SubjectPrerequisite> allPrerequisites = subjectPrerequisiteRepository.findBySubjectIdIn(subjectIds);
        List<SubjectEquivalent> allEquivalents = subjectEquivalentRepository.findBySubjectIdIn(subjectIds);

        return blocks.stream().map(block -> {
            List<CurriculumSubjectComponentDTO> subjectDTOs = curriculumSubjects.stream()
                    .filter(cs -> cs.getKnowledgeBlock().getId().equals(block.getId()))
                    .map(cs -> {
                        List<String> prerequisites = allPrerequisites.stream()
                                .filter(p -> p.getSubject().getId().equals(cs.getSubject().getId()))
                                .map(p -> p.getPrerequisiteSubject().getSubjectCode() + " (" + p.getMinGradeRequired() + ")")
                                .collect(Collectors.toList());
                        
                        List<String> corequisites = allPrerequisites.stream()
                                .filter(p -> p.getSubject().getId().equals(cs.getSubject().getId()) && p.getIsCorequisite())
                                .map(p -> p.getPrerequisiteSubject().getSubjectCode())
                                .collect(Collectors.toList());

                        List<String> equivalents = allEquivalents.stream()
                                .filter(e -> e.getSubject().getId().equals(cs.getSubject().getId()))
                                .map(e -> e.getEquivalentSubject().getSubjectCode())
                                .collect(Collectors.toList());

                        return new CurriculumSubjectComponentDTO(
                                cs.getSubject().getId(),
                                cs.getSubject().getSubjectCode(),
                                cs.getSubject().getName(),
                                cs.getSubject().getCredits(),
                                cs.getRecommendedSemester(),
                                cs.getIsRequired(),
                                prerequisites,
                                corequisites,
                                equivalents
                        );
                    })
                    .collect(Collectors.toList());

            return new KnowledgeBlockDetailDTO(
                    block.getId(),
                    block.getBlockName(),
                    block.getCreditsRequired(),
                    block.getBlockType().name(),
                    subjectDTOs
            );
        }).collect(Collectors.toList());
    }

    public void deleteCurriculum(Long id) {
        curriculumSubjectRepository.deleteByCurriculumId(id);
        knowledgeBlockRepository.deleteByCurriculumId(id);
        curriculumRepository.deleteById(id);
    }

    private CurriculumDTO convertToDTO(Curriculum curriculum) {
        Major major = curriculum.getMajor();
        List<CurriculumSubject> curriculumSubjects = curriculumSubjectRepository.findByCurriculumId(curriculum.getId());
        
        log.debug("Curriculum ID: {}", curriculum.getId());
        log.debug("Found {} subjects for Curriculum ID: {}", curriculumSubjects.size(), curriculum.getId());
        
        int totalCredits = curriculumSubjects.stream()
                .mapToInt(cs -> {
                    if (cs.getSubject() != null) {
                         return cs.getSubject().getCredits();
                    }
                    return 0;
                })
                .sum();
        
        log.debug("Total Credits for Curriculum ID {}: {}", curriculum.getId(), totalCredits);

        int totalBlocks = knowledgeBlockRepository.findByCurriculumId(curriculum.getId()).size();

        CurriculumDTO dto = new CurriculumDTO(
                curriculum.getId(),
                curriculum.getCurriculumName(),
                major.getMajorName(),
                major.getMajorCode(),
                major.getId(),
                curriculum.getAppliedYear(),
                totalCredits, 
                curriculum.getStatus().name(), 
                curriculumSubjects.size(), 
                totalBlocks 
        );
        dto.setCreatedAt(curriculum.getCreatedAt());
        dto.setUpdatedAt(curriculum.getUpdatedAt());
        return dto;
    }
}
