package com.example.demo.service;

import com.example.demo.dto.FacultyDTO;
import com.example.demo.model.Faculty;
import com.example.demo.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    public List<FacultyDTO> getAllFaculties() {
        return facultyRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public FacultyDTO getFacultyById(Long id) {
        Faculty faculty = facultyRepository.findById(id).orElseThrow(() -> new RuntimeException("Faculty not found"));
        return convertToDTO(faculty);
    }

    public FacultyDTO createFaculty(FacultyDTO dto) {
        Faculty faculty = new Faculty();
        faculty.setFacultyCode(dto.getFacultyCode());
        faculty.setFacultyName(dto.getFacultyName());
        faculty.setDescription(dto.getDescription());
        faculty.setStatus(dto.getStatus() != null ? Faculty.Status.valueOf(dto.getStatus()) : Faculty.Status.ACTIVE);
        Faculty saved = facultyRepository.save(faculty);
        return convertToDTO(saved);
    }

    public FacultyDTO updateFaculty(Long id, FacultyDTO dto) {
        Faculty faculty = facultyRepository.findById(id).orElseThrow(() -> new RuntimeException("Faculty not found"));
        faculty.setFacultyCode(dto.getFacultyCode());
        faculty.setFacultyName(dto.getFacultyName());
        faculty.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            faculty.setStatus(Faculty.Status.valueOf(dto.getStatus()));
        }
        Faculty saved = facultyRepository.save(faculty);
        return convertToDTO(saved);
    }

    public void deleteFaculty(Long id) {
        facultyRepository.deleteById(id);
    }

    private FacultyDTO convertToDTO(Faculty faculty) {
        FacultyDTO dto = new FacultyDTO();
        dto.setId(faculty.getId());
        dto.setFacultyCode(faculty.getFacultyCode());
        dto.setFacultyName(faculty.getFacultyName());
        dto.setDescription(faculty.getDescription());
        dto.setStatus(faculty.getStatus().name());
        dto.setCreatedAt(faculty.getCreatedAt());
        dto.setUpdatedAt(faculty.getUpdatedAt());
        return dto;
    }
}
