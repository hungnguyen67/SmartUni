package com.example.demo.controller;

import com.example.demo.dto.LecturerDTO;
import com.example.demo.service.LecturerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturers")
public class LecturerController {

    @Autowired
    private LecturerService lecturerService;

    @GetMapping
    public List<LecturerDTO> getAllLecturers(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long facultyId) {
        return lecturerService.getAllLecturers(searchTerm, facultyId);
    }

    @PostMapping
    public ResponseEntity<LecturerDTO> createLecturer(@RequestBody LecturerDTO lecturerDTO) {
        return ResponseEntity.ok(lecturerService.createLecturer(lecturerDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LecturerDTO> updateLecturer(@PathVariable Long id, @RequestBody LecturerDTO lecturerDTO) {
        return ResponseEntity.ok(lecturerService.updateLecturer(id, lecturerDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLecturer(@PathVariable Long id) {
        lecturerService.deleteLecturer(id);
        return ResponseEntity.ok().build();
    }
}
