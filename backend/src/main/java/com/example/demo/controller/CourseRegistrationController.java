package com.example.demo.controller;

import com.example.demo.model.CourseRegistration;
import com.example.demo.service.CourseRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = "*")
public class CourseRegistrationController {

    @Autowired
    private CourseRegistrationService registrationService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<com.example.demo.dto.CourseRegistrationDTO>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByStudent(studentId));
    }

    @GetMapping("/student/{studentId}/semester/{semesterId}")
    public ResponseEntity<List<com.example.demo.dto.CourseRegistrationDTO>> getByStudentAndSemester(
            @PathVariable Long studentId, 
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByStudentAndSemester(studentId, semesterId));
    }

    @PostMapping
    public ResponseEntity<com.example.demo.dto.CourseRegistrationDTO> register(
            @RequestParam Long studentId, 
            @RequestParam Long classId) {
        return ResponseEntity.ok(registrationService.register(studentId, classId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> drop(@PathVariable Long id) {
        registrationService.drop(id);
        return ResponseEntity.ok().build();
    }
}
