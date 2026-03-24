package com.example.demo.service;

import com.example.demo.dto.SubjectDTO;
import com.example.demo.model.Subject;
import com.example.demo.model.SubjectPrerequisite;
import com.example.demo.model.SubjectPrerequisiteKey;
import com.example.demo.model.SubjectEquivalent;
import com.example.demo.model.SubjectEquivalentKey;
import com.example.demo.dto.SubjectRelationDTO;
import com.example.demo.repository.SubjectEquivalentRepository;
import com.example.demo.repository.SubjectPrerequisiteRepository;
import com.example.demo.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SubjectPrerequisiteRepository prerequisiteRepository;

    @Autowired
    private SubjectEquivalentRepository equivalentRepository;

    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SubjectDTO getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        return convertToDTO(subject);
    }

    @Transactional
    public SubjectDTO createSubject(SubjectDTO dto) {
        Subject subject = new Subject();
        updateSubjectFields(subject, dto);
        Subject saved = subjectRepository.save(subject);
        updateRelations(saved, dto.getRelations());
        return convertToDTO(saved);
    }

    @Transactional
    public SubjectDTO updateSubject(Long id, SubjectDTO dto) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        updateSubjectFields(subject, dto);
        Subject saved = subjectRepository.save(subject);
        updateRelations(saved, dto.getRelations());
        return convertToDTO(saved);
    }

    private void updateSubjectFields(Subject subject, SubjectDTO dto) {
        subject.setSubjectCode(dto.getSubjectCode());
        subject.setName(dto.getName());
        subject.setCredits(dto.getCredits());
        subject.setTheoryCredits(dto.getTheoryCredits());
        subject.setPracticalCredits(dto.getPracticalCredits());
        subject.setTheoryPeriods(dto.getTheoryPeriods());
        subject.setPracticalPeriods(dto.getPracticalPeriods());
        subject.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            subject.setStatus(Subject.Status.valueOf(dto.getStatus()));
        }
    }

    private void updateRelations(Subject subject, List<SubjectRelationDTO> relationDTOs) {
        if (relationDTOs == null) return;
        
        // Delete existing relations
        prerequisiteRepository.deleteBySubjectId(subject.getId());
        equivalentRepository.deleteBySubjectId(subject.getId());
        
        // Add new relations
        for (SubjectRelationDTO relDTO : relationDTOs) {
            String subjectCode = relDTO.getSubjectCode();
            if (subjectCode == null || subjectCode.isEmpty()) continue;

            Subject targetSubject = subjectRepository.findBySubjectCode(subjectCode)
                    .orElseThrow(() -> new RuntimeException("Relation subject not found: " + subjectCode));
            
            String type = relDTO.getRelationType();
            if ("PREREQUISITE".equals(type) || "COREQUISITE".equals(type)) {
                SubjectPrerequisite pre = new SubjectPrerequisite();
                pre.setId(new SubjectPrerequisiteKey(subject.getId(), targetSubject.getId()));
                pre.setSubject(subject);
                pre.setPrerequisiteSubject(targetSubject);
                pre.setMinGradeRequired(relDTO.getMinGrade() != null ? relDTO.getMinGrade() : "D");
                pre.setIsCorequisite("COREQUISITE".equals(type) || (relDTO.getIsParallel() != null && relDTO.getIsParallel()));
                prerequisiteRepository.save(pre);
            } else if ("EQUIVALENT".equals(type)) {
                SubjectEquivalent eq = new SubjectEquivalent();
                eq.setId(new SubjectEquivalentKey(subject.getId(), targetSubject.getId()));
                eq.setSubject(subject);
                eq.setEquivalentSubject(targetSubject);
                eq.setMinGradeRequired(relDTO.getMinGrade() != null ? relDTO.getMinGrade() : "D");
                eq.setEffectiveFrom(relDTO.getEffectiveFrom());
                eq.setEffectiveTo(relDTO.getEffectiveTo());
                equivalentRepository.save(eq);
            }
        }
    }

    private SubjectDTO convertToDTO(Subject subject) {
        SubjectDTO dto = new SubjectDTO();
        dto.setId(subject.getId());
        dto.setSubjectCode(subject.getSubjectCode());
        dto.setName(subject.getName());
        dto.setCredits(subject.getCredits());
        dto.setTheoryCredits(subject.getTheoryCredits());
        dto.setPracticalCredits(subject.getPracticalCredits());
        dto.setTheoryPeriods(subject.getTheoryPeriods());
        dto.setPracticalPeriods(subject.getPracticalPeriods());
        dto.setDescription(subject.getDescription());
        dto.setStatus(subject.getStatus().name());
        dto.setCreatedAt(subject.getCreatedAt());
        dto.setUpdatedAt(subject.getUpdatedAt());

        List<SubjectRelationDTO> relations = new ArrayList<>();
        
        // Fetch Prerequisites & Corequisites
        prerequisiteRepository.findBySubjectId(subject.getId()).stream()
                .map(p -> {
                    SubjectRelationDTO r = new SubjectRelationDTO(
                        p.getIsCorequisite() ? "COREQUISITE" : "PREREQUISITE",
                        p.getPrerequisiteSubject().getSubjectCode(),
                        p.getPrerequisiteSubject().getName()
                    );
                    r.setMinGrade(p.getMinGradeRequired());
                    r.setIsParallel(p.getIsCorequisite()); // Assuming parallel means corequisite here
                    return r;
                })
                .forEach(relations::add);
        
        // Fetch Equivalents
        equivalentRepository.findBySubjectId(subject.getId()).stream()
                .map(e -> {
                    SubjectRelationDTO r = new SubjectRelationDTO(
                        "EQUIVALENT",
                        e.getEquivalentSubject().getSubjectCode(),
                        e.getEquivalentSubject().getName()
                    );
                    r.setMinGrade(e.getMinGradeRequired());
                    r.setEffectiveFrom(e.getEffectiveFrom());
                    r.setEffectiveTo(e.getEffectiveTo());
                    return r;
                })
                .forEach(relations::add);

        dto.setRelations(relations);
        return dto;
    }
}
