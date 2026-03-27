package com.example.demo.controller;

import com.example.demo.dto.ExamScheduleDTO;
import com.example.demo.dto.StudentExamDTO;
import com.example.demo.service.ExamScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/exam-schedules")
@CrossOrigin(origins = "http://localhost:4200")
public class UserExamScheduleController {

    @Autowired
    private ExamScheduleService examScheduleService;

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<List<ExamScheduleDTO>> getLecturerSchedules(@PathVariable Long lecturerId) {
        return ResponseEntity.ok(examScheduleService.getLecturerExamSchedules(lecturerId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentExamDTO>> getStudentSchedules(@PathVariable Long studentId) {
        return ResponseEntity.ok(examScheduleService.getStudentExamSchedules(studentId));
    }
}
