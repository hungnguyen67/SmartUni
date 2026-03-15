package com.example.demo.controller;

import com.example.demo.dto.StudentDTO;
import com.example.demo.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping
    public List<StudentDTO> searchStudents(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) Integer enrollmentYear,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double minGpa,
            @RequestParam(required = false) Double maxGpa
    ) {
        return studentService.searchStudents(searchTerm, classId, majorId, enrollmentYear, status, minGpa, maxGpa);
    }

    @GetMapping("/enrollment-years")
    public List<Integer> getEnrollmentYears() {
        return studentService.getDistinctEnrollmentYears();
    }
}
