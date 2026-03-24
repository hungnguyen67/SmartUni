package com.example.demo.service;

import com.example.demo.dto.CurriculumDTO;
import com.example.demo.model.Curriculum;
import com.example.demo.model.Major;
import com.example.demo.repository.CurriculumRepository;
import com.example.demo.repository.MajorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.dto.CurriculumSubjectComponentDTO;
import com.example.demo.dto.CurriculumSubjectDetailDTO;
import com.example.demo.dto.KnowledgeBlockDTO;
import com.example.demo.dto.KnowledgeBlockDetailDTO;
import com.example.demo.model.CurriculumSubject;
import com.example.demo.model.KnowledgeBlock;
import com.example.demo.model.SubjectEquivalent;
import com.example.demo.model.SubjectPrerequisite;
import com.example.demo.repository.CurriculumSubjectRepository;
import com.example.demo.repository.KnowledgeBlockRepository;
import com.example.demo.repository.SubjectEquivalentRepository;
import com.example.demo.repository.SubjectPrerequisiteRepository;
import com.example.demo.repository.SubjectRepository;
import com.example.demo.model.CurriculumSubjectKey;
import com.example.demo.model.Subject;
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
        private SubjectRepository subjectRepository;

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
                Curriculum curriculum = curriculumRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Curriculum not found"));
                return convertToDTO(curriculum);
        }

        public List<KnowledgeBlockDetailDTO> getCurriculumDetails(Long curriculumId) {
                List<KnowledgeBlock> blocks = knowledgeBlockRepository.findByCurriculumId(curriculumId);
                List<CurriculumSubject> curriculumSubjects = curriculumSubjectRepository
                                .findByCurriculumId(curriculumId);

                List<Long> subjectIds = curriculumSubjects.stream()
                                .map(cs -> cs.getSubject().getId())
                                .collect(Collectors.toList());

                List<SubjectPrerequisite> allPrerequisites = subjectPrerequisiteRepository
                                .findBySubjectIdIn(subjectIds);
                List<SubjectEquivalent> allEquivalents = subjectEquivalentRepository.findBySubjectIdIn(subjectIds);

                return blocks.stream().map(block -> {
                        List<CurriculumSubjectComponentDTO> subjectDTOs = curriculumSubjects.stream()
                                        .filter(cs -> cs.getKnowledgeBlock().getId().equals(block.getId()))
                                        .map(cs -> {
                                                List<String> prerequisites = allPrerequisites.stream()
                                                                .filter(p -> p.getSubject().getId()
                                                                                .equals(cs.getSubject().getId()))
                                                                .map(p -> p.getPrerequisiteSubject().getName())
                                                                .collect(Collectors.toList());

                                                List<String> corequisites = allPrerequisites.stream()
                                                                .filter(p -> p.getSubject().getId()
                                                                                .equals(cs.getSubject().getId())
                                                                                && p.getIsCorequisite())
                                                                .map(p -> p.getPrerequisiteSubject().getSubjectCode())
                                                                .collect(Collectors.toList());

                                                List<String> equivalents = allEquivalents.stream()
                                                                .filter(e -> e.getSubject().getId()
                                                                                .equals(cs.getSubject().getId()))
                                                                .map(e -> e.getEquivalentSubject().getSubjectCode())
                                                                .collect(Collectors.toList());

                                                return new CurriculumSubjectComponentDTO(
                                                                cs.getSubject().getId(),
                                                                cs.getSubject().getSubjectCode(),
                                                                cs.getSubject().getName(),
                                                                cs.getSubject().getCredits(),
                                                                cs.getRecommendedSemester(),
                                                                prerequisites,
                                                                corequisites,
                                                                equivalents);
                                        })
                                        .collect(Collectors.toList());

                        return new KnowledgeBlockDetailDTO(
                                        block.getId(),
                                        block.getBlockName(),
                                        block.getBlockCode(),
                                        block.getCreditsRequired(),
                                        block.getBlockType().name(),
                                        subjectDTOs);
                }).collect(Collectors.toList());
        }

        public CurriculumDTO createCurriculum(CurriculumDTO dto) {
                Curriculum curriculum = new Curriculum();
                updateEntityFromDTO(curriculum, dto);
                curriculum = curriculumRepository.save(curriculum);
                return convertToDTO(curriculum);
        }

        public CurriculumDTO updateCurriculum(Long id, CurriculumDTO dto) {
                Curriculum curriculum = curriculumRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Curriculum not found"));
                updateEntityFromDTO(curriculum, dto);
                curriculum = curriculumRepository.save(curriculum);
                return convertToDTO(curriculum);
        }

        private void updateEntityFromDTO(Curriculum entity, CurriculumDTO dto) {
                Major major = majorRepository.findById(dto.getMajorId())
                                .orElseThrow(() -> new RuntimeException("Major not found"));
                entity.setCurriculumName(dto.getCurriculumName());
                entity.setMajor(major);
                entity.setAppliedYear(dto.getAppliedYear());
                entity.setStatus(Curriculum.Status.valueOf(dto.getStatus()));
                if (dto.getTotalCreditsRequired() != null) {
                        entity.setTotalCreditsRequired(dto.getTotalCreditsRequired());
                }
        }

    public List<KnowledgeBlockDTO> getAllKnowledgeBlocks() {
        return knowledgeBlockRepository.findAll().stream().map(block -> {
            KnowledgeBlockDTO dto = new KnowledgeBlockDTO();
            dto.setId(block.getId());
            dto.setBlockCode(block.getBlockCode());
            dto.setBlockName(block.getBlockName());
            dto.setCurriculumId(block.getCurriculum().getId());
            dto.setCurriculumName(block.getCurriculum().getCurriculumName());
            dto.setCreditsRequired(block.getCreditsRequired());
            dto.setBlockType(block.getBlockType().name());
            return dto;
        }).collect(Collectors.toList());
    }

    public List<CurriculumSubjectDetailDTO> getAllCurriculumSubjects() {
        return curriculumSubjectRepository.findAll().stream().map(cs -> {
            CurriculumSubjectDetailDTO dto = new CurriculumSubjectDetailDTO();
            dto.setSubjectId(cs.getSubject().getId());
            dto.setSubjectCode(cs.getSubject().getSubjectCode());
            dto.setSubjectName(cs.getSubject().getName());
            dto.setCurriculumId(cs.getCurriculum().getId());
            dto.setCurriculumName(cs.getCurriculum().getCurriculumName());
            dto.setBlockId(cs.getKnowledgeBlock().getId());
            dto.setBlockName(cs.getKnowledgeBlock().getBlockName());
            dto.setRecommendedSemester(cs.getRecommendedSemester());
            dto.setCredits(cs.getSubject().getCredits());
            return dto;
        }).collect(Collectors.toList());
    }

    public KnowledgeBlockDTO createKnowledgeBlock(KnowledgeBlockDTO dto) {
        KnowledgeBlock block = new KnowledgeBlock();
        Curriculum curriculum = curriculumRepository.findById(dto.getCurriculumId())
                .orElseThrow(() -> new RuntimeException("Curriculum not found"));
        block.setCurriculum(curriculum);
        block.setBlockName(dto.getBlockName());
        block.setBlockCode(dto.getBlockCode());
        block.setCreditsRequired(dto.getCreditsRequired());
        block.setBlockType(KnowledgeBlock.BlockType.valueOf(dto.getBlockType()));
        block = knowledgeBlockRepository.save(block);
        dto.setId(block.getId());
        dto.setCurriculumName(curriculum.getCurriculumName());
        return dto;
    }

    public KnowledgeBlockDTO updateKnowledgeBlock(Long id, KnowledgeBlockDTO dto) {
        KnowledgeBlock block = knowledgeBlockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("KnowledgeBlock not found"));
        block.setBlockName(dto.getBlockName());
        block.setBlockCode(dto.getBlockCode());
        block.setCreditsRequired(dto.getCreditsRequired());
        if (dto.getBlockType() != null) {
            block.setBlockType(KnowledgeBlock.BlockType.valueOf(dto.getBlockType()));
        }
        block = knowledgeBlockRepository.save(block);
        return dto;
    }

    public void deleteKnowledgeBlock(Long id) {
        knowledgeBlockRepository.deleteById(id);
    }

    public CurriculumSubjectDetailDTO addSubjectToCurriculum(CurriculumSubjectDetailDTO dto) {
        Curriculum curriculum = curriculumRepository.findById(dto.getCurriculumId())
                .orElseThrow(() -> new RuntimeException("Curriculum not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        KnowledgeBlock block = knowledgeBlockRepository.findById(dto.getBlockId())
                .orElseThrow(() -> new RuntimeException("Knowledge block not found"));

        CurriculumSubject cs = new CurriculumSubject();
        cs.setId(new CurriculumSubjectKey(dto.getCurriculumId(), dto.getSubjectId()));
        cs.setCurriculum(curriculum);
        cs.setSubject(subject);
        cs.setKnowledgeBlock(block);
        cs.setRecommendedSemester(dto.getRecommendedSemester());
        
        curriculumSubjectRepository.save(cs);
        return dto;
    }

    public CurriculumSubjectDetailDTO updateCurriculumSubject(CurriculumSubjectDetailDTO dto) {
        CurriculumSubject cs = curriculumSubjectRepository.findById(new CurriculumSubjectKey(dto.getCurriculumId(), dto.getSubjectId()))
                .orElseThrow(() -> new RuntimeException("CurriculumSubject not found"));
        
        KnowledgeBlock block = knowledgeBlockRepository.findById(dto.getBlockId())
                .orElseThrow(() -> new RuntimeException("Knowledge block not found"));
        
        cs.setKnowledgeBlock(block);
        cs.setRecommendedSemester(dto.getRecommendedSemester());
        
        curriculumSubjectRepository.save(cs);
        return dto;
    }

    public void deleteCurriculumSubject(Long curriculumId, Long subjectId) {
        curriculumSubjectRepository.deleteById(new CurriculumSubjectKey(curriculumId, subjectId));
    }

    public void deleteCurriculum(Long id) {
                curriculumSubjectRepository.deleteByCurriculumId(id);
                knowledgeBlockRepository.deleteByCurriculumId(id);
                curriculumRepository.deleteById(id);
        }

        private CurriculumDTO convertToDTO(Curriculum curriculum) {
                Major major = curriculum.getMajor();
                List<CurriculumSubject> curriculumSubjects = curriculumSubjectRepository
                                .findByCurriculumId(curriculum.getId());

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
                                totalBlocks);
                dto.setCreatedAt(curriculum.getCreatedAt());
                dto.setUpdatedAt(curriculum.getUpdatedAt());
                return dto;
        }
}
