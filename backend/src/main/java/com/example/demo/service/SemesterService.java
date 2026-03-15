package com.example.demo.service;

import com.example.demo.dto.SemesterDTO;
import com.example.demo.model.Semester;
import com.example.demo.repository.SemesterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SemesterService {

    @Autowired
    private SemesterRepository semesterRepository;

    public List<SemesterDTO> getAllSemesters() {
        return semesterRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public SemesterDTO getSemesterById(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));
        return convertToDTO(semester);
    }

    public SemesterDTO createSemester(SemesterDTO semesterDTO) {
        Semester semester = new Semester();
        return saveSemester(semester, semesterDTO);
    }

    public SemesterDTO updateSemester(Long id, SemesterDTO semesterDTO) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));
        return saveSemester(semester, semesterDTO);
    }

    public void deleteSemester(Long id) {
        semesterRepository.deleteById(id);
    }

    private SemesterDTO saveSemester(Semester semester, SemesterDTO dto) {
        semester.setName(dto.getName());
        semester.setAcademicYear(dto.getAcademicYear());
        semester.setSemesterOrder(dto.getSemesterOrder());
        semester.setStartDate(dto.getStartDate());
        semester.setEndDate(dto.getEndDate());
        if (dto.getSemesterStatus() != null) {
            semester.setSemesterStatus(Semester.SemesterStatus.valueOf(dto.getSemesterStatus()));
        }
        Semester savedSemester = semesterRepository.save(semester);
        return convertToDTO(savedSemester);
    }

    private SemesterDTO convertToDTO(Semester semester) {
        return new SemesterDTO(
                semester.getId(),
                semester.getName(),
                semester.getAcademicYear(),
                semester.getSemesterOrder(),
                semester.getStartDate(),
                semester.getEndDate(),
                semester.getSemesterStatus().name(),
                semester.getCreatedAt(),
                semester.getUpdatedAt()
        );
    }
}
