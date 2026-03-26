package com.example.demo.controller;

import com.example.demo.dto.ExamScheduleCreateDTO;
import com.example.demo.service.ExamScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/exam-schedules")
@CrossOrigin(origins = "http://localhost:4200")
public class ExamScheduleController {

    @Autowired
    private ExamScheduleService examScheduleService;

    @GetMapping
    public ResponseEntity<java.util.List<com.example.demo.dto.ExamScheduleDTO>> getAllSchedules() {
        return ResponseEntity.ok(examScheduleService.getAllSchedules());
    }

    @PostMapping("/auto-arrange")
    public ResponseEntity<?> autoArrangeExam(@RequestBody ExamScheduleCreateDTO dto) {
        try {
            examScheduleService.createExamSchedule(dto);
            java.util.Map<String, String> res = new java.util.HashMap<>();
            res.put("status", "SUCCESS");
            res.put("message", "Xếp lịch thi thành công");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            java.util.Map<String, String> err = new java.util.HashMap<>();
            err.put("status", "ERROR");
            err.put("message", e.getMessage() != null ? e.getMessage() : e.toString());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/assigned-student-codes")
    public ResponseEntity<java.util.List<String>> getAssignedStudentCodes(
            @RequestParam Long subjectId,
            @RequestParam Long semesterId,
            @RequestParam String examType) {
        return ResponseEntity.ok(examScheduleService.getAssignedStudentCodes(subjectId, semesterId, examType));
    }

    @GetMapping("/assigned-keys")
    public ResponseEntity<java.util.List<String>> getAllAssignedKeys(
            @RequestParam Long semesterId,
            @RequestParam String examType) {
        return ResponseEntity.ok(examScheduleService.getAllAssignedKeys(semesterId, examType));
    }
}
