package com.example.demo.controller;

import com.example.demo.service.ScheduleService;
import com.example.demo.model.ClassSchedulePattern;
import com.example.demo.model.AttendanceSession;
import com.example.demo.dto.ClassScheduleInstanceDTO;
import com.example.demo.dto.SessionDetailDTO;
import com.example.demo.dto.AttendanceSubmitDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @PostMapping("/patterns/{classId}")
    public ResponseEntity<Void> addPattern(@PathVariable Long classId, @RequestBody ClassSchedulePattern pattern) {
        scheduleService.addPattern(classId, pattern);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/patterns/{classId}/bulk")
    public ResponseEntity<Void> addPatternsBulk(@PathVariable Long classId, @RequestBody List<ClassSchedulePattern> patterns) {
        scheduleService.addPatternsBulk(classId, patterns);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/patterns/{patternId}")
    public ResponseEntity<Void> deletePattern(@PathVariable Long patternId) {
        scheduleService.deletePattern(patternId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/patterns/{patternId}/single")
    public ResponseEntity<Void> deletePatternSingle(@PathVariable Long patternId, @RequestParam Integer week) {
        scheduleService.deletePatternSingle(patternId, week);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/patterns/{patternId}/forward")
    public ResponseEntity<Void> deletePatternForward(@PathVariable Long patternId, @RequestParam Integer week) {
        scheduleService.deletePatternForward(patternId, week);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/patterns/{patternId}")
    public ResponseEntity<Void> updatePattern(
            @PathVariable Long patternId,
            @RequestParam Integer startPeriod,
            @RequestParam Integer endPeriod,
            @RequestParam(required = false) String roomName,
            @RequestParam(required = false) String lecturerName) {
        scheduleService.updatePattern(patternId, startPeriod, endPeriod, roomName, lecturerName);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate/{classId}")
    public ResponseEntity<Void> generateInstances(@PathVariable Long classId) {
        scheduleService.generateInstances(classId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<ClassScheduleInstanceDTO>> getScheduleByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(scheduleService.getScheduleByClass(classId));
    }

    @GetMapping("/conflicts/{classId}")
    public ResponseEntity<List<ScheduleService.ConflictInfo>> checkConflicts(@PathVariable Long classId) {
        return ResponseEntity.ok(scheduleService.checkConflicts(classId));
    }

    @GetMapping("/student/{studentId}/semester/{semesterId}")
    public ResponseEntity<List<ClassScheduleInstanceDTO>> getStudentSchedule(
            @PathVariable Long studentId,
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(scheduleService.getStudentSchedule(studentId, semesterId));
    }

    @GetMapping("/lecturer/{lecturerId}/semester/{semesterId}")
    public ResponseEntity<List<ClassScheduleInstanceDTO>> getLecturerSchedule(
            @PathVariable Long lecturerId,
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(scheduleService.getLecturerSchedule(lecturerId, semesterId));
    }

    @GetMapping("/sessions/{instanceId}")
    public ResponseEntity<SessionDetailDTO> getSessionDetail(@PathVariable Long instanceId) {
        return ResponseEntity.ok(scheduleService.getScheduleInstanceDetail(instanceId));
    }

    @PostMapping("/attendance/open")
    public ResponseEntity<?> openAttendance(@RequestParam Long instanceId, @RequestParam String code) {
        AttendanceSession session = scheduleService.openAttendanceSession(instanceId, code);
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("attendanceCode", session.getAttendanceCode());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/attendance/manual")
    public ResponseEntity<?> submitManualAttendance(@RequestBody AttendanceSubmitDTO dto) {
        scheduleService.submitManualAttendance(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/attendance/self")
    public ResponseEntity<?> selfAttend(@RequestParam String code, @RequestParam Long studentId, @RequestParam Long instanceId) {
        scheduleService.selfAttend(code, studentId, instanceId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/attendance/finalize")
    public ResponseEntity<?> finalizeAttendance(@RequestParam Long instanceId) {
        scheduleService.finalizeAutoAttendance(instanceId);
        return ResponseEntity.ok().build();
    }
}
