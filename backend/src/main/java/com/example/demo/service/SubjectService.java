package com.example.demo.service;

import com.example.demo.dto.SubjectDTO;
import com.example.demo.model.Subject;
import com.example.demo.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SubjectDTO getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        return convertToDTO(subject);
    }

    public SubjectDTO createSubject(SubjectDTO dto) {
        Subject subject = new Subject();
        updateSubjectFields(subject, dto);
        Subject saved = subjectRepository.save(subject);
        return convertToDTO(saved);
    }

    public SubjectDTO updateSubject(Long id, SubjectDTO dto) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        updateSubjectFields(subject, dto);
        Subject saved = subjectRepository.save(subject);
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
        return dto;
    }
}
