package com.example.demo.service;

import com.example.demo.model.CourseClass;
import com.example.demo.model.CourseRegistration;
import com.example.demo.model.StudentProfile;
import com.example.demo.repository.CourseClassRepository;
import com.example.demo.repository.CourseRegistrationRepository;
import com.example.demo.repository.StudentProfileRepository;
import com.example.demo.repository.ClassScheduleInstanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class CourseRegistrationService {

    @Autowired
    private CourseRegistrationRepository registrationRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private ClassScheduleInstanceRepository instanceRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<com.example.demo.dto.CourseRegistrationDTO> getRegistrationsByStudent(Long studentId) {
        return registrationRepository.findByStudentUserId(studentId)
                .stream().map(this::convertToDTO).collect(java.util.stream.Collectors.toList());
    }

    public List<com.example.demo.dto.CourseRegistrationDTO> getRegistrationsByStudentAndSemester(Long studentId,
            Long semesterId) {
        return registrationRepository.findByStudentUserIdAndCourseClassSemesterId(studentId, semesterId)
                .stream().map(this::convertToDTO).collect(java.util.stream.Collectors.toList());
    }

    public List<com.example.demo.dto.CourseRegistrationDTO> getRegistrationsByClass(Long classId) {
        return registrationRepository.findByCourseClassId(classId)
                .stream().map(this::convertToDTO).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void updateGrades(List<com.example.demo.dto.CourseRegistrationDTO> dtos) {
        Set<Long> affectedStudentIds = new HashSet<>();
        for (com.example.demo.dto.CourseRegistrationDTO dto : dtos) {
            CourseRegistration reg = registrationRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Registration not found"));
            
            // Check if class is already CLOSED
            if (reg.getCourseClass().getClassStatus() == CourseClass.ClassStatus.CLOSED) {
                continue;
            }

            reg.setAttendanceScore(dto.getAttendanceScore());
            reg.setMidtermScore(dto.getMidtermScore());
            reg.setFinalScore(dto.getFinalScore());
            
            reg.setScoreUpdatedAt(java.time.LocalDateTime.now());
            registrationRepository.save(reg);
            
            // Collect student IDs for recalculation only if they belong to a closed class or completed status
            // BUT usually we want to see immediate impact in modal even if class is not closed yet?
            // The user wants "reasonable logic". Usually current GPA includes everything graded.
            affectedStudentIds.add(reg.getStudent().getUserId());
        }

        // Trigger recalculation to sync profile with new rules (skip non-COMPLETED)
        for (Long studentId : affectedStudentIds) {
            recalculateStudentSummary(studentId);
        }
    }

    @Transactional
    public void lockGrades(Long classId) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course class not found"));
        
        // Stage 5: Khóa sổ (CLOSED)
        cc.setClassStatus(CourseClass.ClassStatus.CLOSED);
        courseClassRepository.save(cc);
        
        // Cập nhật toàn bộ sinh viên đang theo học (STUDYING) sang hoàn thành (COMPLETED)
        List<CourseRegistration> regs = registrationRepository.findByCourseClassId(classId);
        Set<Long> affectedStudentIds = new HashSet<>();
        for (CourseRegistration reg : regs) {
            if (reg.getStatus() == CourseRegistration.RegistrationStatus.STUDYING) {
                reg.setStatus(CourseRegistration.RegistrationStatus.COMPLETED);
                registrationRepository.save(reg);
                affectedStudentIds.add(reg.getStudent().getUserId());
            }
        }

        // Trigger recalculation
        for (Long studentId : affectedStudentIds) {
            recalculateStudentSummary(studentId);
        }
    }

    private void recalculateStudentSummary(Long studentId) {
        List<CourseRegistration> registrations = registrationRepository.findByStudentUserId(studentId);
        
        // Sử dụng Map để lấy kết quả cao nhất của mỗi môn học (trường hợp học cải thiện/học lại)
        java.util.Map<Long, CourseRegistration> bestGradesBySubject = new java.util.HashMap<>();
        
        for (CourseRegistration reg : registrations) {
            if (reg.getStatus() != null && "COMPLETED".equals(reg.getStatus().name()) && 
                reg.getTotalScore() != null && reg.getCourseClass() != null && reg.getCourseClass().getSubject() != null) {
                Long subjectId = reg.getCourseClass().getSubject().getId();
                if (!bestGradesBySubject.containsKey(subjectId) || 
                    reg.getTotalScore() > bestGradesBySubject.get(subjectId).getTotalScore()) {
                    bestGradesBySubject.put(subjectId, reg);
                }
            }
        }

        int totalCreditsPass = 0;
        double sumWeightedPoint4 = 0.0;
        double sumWeightedPoint10 = 0.0;
        int totalCreditsForGPA = 0;

        for (CourseRegistration reg : bestGradesBySubject.values()) {
            int credits = reg.getCourseClass().getSubject().getCredits();
            
            // Tính tổng tín chỉ tích lũy (môn đạt)
            if (Boolean.TRUE.equals(reg.getIsPassed())) {
                totalCreditsPass += credits;
            }
            
            // Tính tổng điểm có trọng số cho GPA
            sumWeightedPoint4 += (reg.getGradePoint() != null ? reg.getGradePoint() : 0.0) * credits;
            sumWeightedPoint10 += (reg.getTotalScore() != null ? reg.getTotalScore() : 0.0) * credits;
            totalCreditsForGPA += credits;
        }

        StudentProfile profile = studentProfileRepository.findById(studentId).orElse(null);
        if (profile != null) {
            double gpa4 = totalCreditsForGPA > 0 ? sumWeightedPoint4 / totalCreditsForGPA : 0.0;
            double gpa10 = totalCreditsForGPA > 0 ? sumWeightedPoint10 / totalCreditsForGPA : 0.0;
            
            // Làm tròn 2 chữ số thập phân
            profile.setCurrentGpa(Math.round(gpa4 * 100.0) / 100.0);
            profile.setCurrentGpa10(Math.round(gpa10 * 100.0) / 100.0);
            profile.setTotalCreditsEarned(totalCreditsPass);
            profile.setUpdatedAt(java.time.LocalDateTime.now());
            studentProfileRepository.save(profile);
        }
    }

    private com.example.demo.dto.CourseRegistrationDTO convertToDTO(CourseRegistration reg) {
        com.example.demo.dto.CourseRegistrationDTO dto = new com.example.demo.dto.CourseRegistrationDTO();
        dto.setId(reg.getId());
        dto.setEnrollmentDate(reg.getEnrollmentDate());
        dto.setStatus(reg.getStatus().name());
        dto.setAttendanceScore(reg.getAttendanceScore());
        dto.setMidtermScore(reg.getMidtermScore());
        dto.setFinalScore(reg.getFinalScore());
        dto.setTotalScore(reg.getTotalScore());
        dto.setGradeLetter(reg.getGradeLetter());
        dto.setGradePoint(reg.getGradePoint());

        if (reg.getCourseClass() != null) {
            CourseClass cc = reg.getCourseClass();
            dto.setClassId(cc.getId());
            dto.setClassCode(cc.getClassCode());

            if (cc.getLecturer() != null && cc.getLecturer().getUser() != null) {
                dto.setLecturerName(cc.getLecturer().getUser().getFullName());
            }

            if (cc.getSchedules() != null) {
                dto.setSchedules(cc.getSchedules().stream()
                        .map(s -> new com.example.demo.dto.CourseClassDTO.ScheduleDTO(
                                s.getDayOfWeek(),
                                s.getStartPeriod(),
                                s.getEndPeriod(),
                                s.getStartTime(),
                                s.getEndTime(),
                                s.getRoomName(),
                                s.getSessionType()))
                        .collect(java.util.stream.Collectors.toList()));
            }

            LocalDate actualStart = instanceRepository.findMinDateByCourseClassId(cc.getId());
            LocalDate actualEnd = instanceRepository.findMaxDateByCourseClassId(cc.getId());
            dto.setStartDate(actualStart != null ? actualStart : cc.getStartDate());
            dto.setEndDate(actualEnd != null ? actualEnd : cc.getEndDate());

            if (cc.getSubject() != null) {
                dto.setSubjectName(cc.getSubject().getName());
                dto.setSubjectId(cc.getSubject().getId());
                dto.setCredits(cc.getSubject().getCredits());
                dto.setSubjectType("Bắt buộc");
                dto.setClassStatus(cc.getClassStatus().name());
            }
        }

        if (reg.getStudent() != null) {
            StudentProfile sp = reg.getStudent();
            dto.setStudentId(sp.getUserId());
            dto.setStudentCode(sp.getStudentCode());
            if (sp.getUser() != null) {
                dto.setStudentName(sp.getUser().getFullName());
            }
            if (sp.getAdministrativeClass() != null) {
                dto.setClassName(sp.getAdministrativeClass().getClassName());
                dto.setAdminClassCode(sp.getAdministrativeClass().getClassCode());
            }
        }

        return dto;
    }

    @Transactional
    public com.example.demo.dto.CourseRegistrationDTO register(Long studentId, Long classId) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course class not found"));

        if (!cc.getAllowRegister()) {
            throw new RuntimeException("Class is not open for registration");
        }

        if (cc.getCurrentEnrolled() >= cc.getMaxStudents()) {
            throw new RuntimeException("Class is full");
        }

        StudentProfile student = studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        if (registrationRepository.findByCourseClassIdAndStudentUserId(classId, studentId).isPresent()) {
            throw new RuntimeException("Already registered for this class");
        }

        CourseRegistration reg = new CourseRegistration();
        reg.setStudent(student);
        reg.setCourseClass(cc);
        reg.setStatus(CourseRegistration.RegistrationStatus.REGISTERED);

        com.example.demo.dto.CourseRegistrationDTO result = convertToDTO(registrationRepository.save(reg));
        
        // Gửi tín hiệu realtime qua WebSocket
        messagingTemplate.convertAndSend("/topic/enrollment-updates", "REGISTERED");
        
        return result;
    }

    @Transactional
    public void drop(Long registrationId) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        registrationRepository.delete(reg);
        
        // Gửi tín hiệu realtime qua WebSocket
        messagingTemplate.convertAndSend("/topic/enrollment-updates", "DROPPED");
    }
}
