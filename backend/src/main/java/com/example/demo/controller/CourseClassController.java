package com.example.demo.controller;

import com.example.demo.dto.CourseClassDTO;
import com.example.demo.dto.CourseSubjectGroupDTO;
import com.example.demo.service.CourseClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-classes")
@CrossOrigin(origins = "*")
public class CourseClassController {

    @Autowired
    private CourseClassService courseClassService;

    @GetMapping("/subjects")
    public ResponseEntity<List<CourseSubjectGroupDTO>> getGroupedSubjects(
            @RequestParam Long semesterId,
            @RequestParam(required = false) Long studentId) {
        return ResponseEntity.ok(courseClassService.getGroupedSubjectsBySemester(semesterId, studentId));
    }

    @GetMapping
    public ResponseEntity<List<CourseClassDTO>> getClasses(@RequestParam Long semesterId) {
        return ResponseEntity.ok(courseClassService.getClassesBySemester(semesterId));
    }

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<CourseClassDTO>> getLecturerClasses(
            @PathVariable Long lecturerId, 
            @RequestParam Long semesterId) {
        return ResponseEntity.ok(courseClassService.getClassesByLecturerAndSemester(lecturerId, semesterId));
    }

    @GetMapping("/analysis")
    public ResponseEntity<List<com.example.demo.dto.CourseClassDemandAnalysisDTO>> getDemandAnalysis(
            @RequestParam Long semesterId,
            @RequestParam(required = false) Integer cohort,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) Long curriculumId) {
        return ResponseEntity.ok(courseClassService.analyzeDemand(semesterId, cohort, majorId, curriculumId));
    }

    @GetMapping("/details")
    public ResponseEntity<List<CourseClassDTO>> getClassDetails(
            @RequestParam Long semesterId, 
            @RequestParam Long subjectId) {
        return ResponseEntity.ok(courseClassService.getClassesBySubjectAndSemester(semesterId, subjectId));
    }

    @PostMapping
    public ResponseEntity<CourseClassDTO> createCourseClass(
            @RequestParam Long semesterId, 
            @RequestBody CourseClassDTO dto) {
        return ResponseEntity.ok(courseClassService.createCourseClass(semesterId, dto));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<CourseClassDTO>> createBatch(
            @RequestParam Long semesterId, 
            @RequestBody List<CourseClassDTO> dtos) {
        return ResponseEntity.ok(courseClassService.createBatch(semesterId, dtos));
    }

    @PostMapping("/auto-batch")
    public ResponseEntity<List<CourseClassDTO>> generateAutoBatch(
            @RequestParam Long semesterId, 
            @RequestBody List<com.example.demo.dto.CourseClassDemandAnalysisDTO> demands) {
        return ResponseEntity.ok(courseClassService.generateAutoBatch(semesterId, demands));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseClassDTO> updateCourseClass(
            @PathVariable Long id, 
            @RequestBody CourseClassDTO dto) {
        return ResponseEntity.ok(courseClassService.updateCourseClass(id, dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        courseClassService.updateStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourseClass(@PathVariable Long id) {
        courseClassService.deleteCourseClass(id);
        return ResponseEntity.ok().build();
    }
}
