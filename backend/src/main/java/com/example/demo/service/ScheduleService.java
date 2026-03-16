package com.example.demo.service;

import com.example.demo.dto.AttendanceSubmitDTO;
import com.example.demo.dto.SessionDetailDTO;
import com.example.demo.dto.StudentDTO;
import com.example.demo.model.*;
import com.example.demo.repository.ClassScheduleInstanceRepository;
import com.example.demo.repository.ClassSchedulePatternRepository;
import com.example.demo.repository.CourseClassRepository;
import com.example.demo.repository.CourseRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    @Autowired
    private ClassScheduleInstanceRepository instanceRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private ClassSchedulePatternRepository patternRepository;

    @Autowired
    private com.example.demo.repository.LecturerProfileRepository lecturerRepository;

    @Autowired
    private CourseRegistrationRepository registrationRepository;

    @Autowired
    private com.example.demo.repository.StudentProfileRepository studentRepository;

    @Autowired
    private com.example.demo.repository.AttendanceSessionRepository attendanceSessionRepository;

    @Autowired
    private com.example.demo.repository.AttendanceRepository attendanceRepository;

    @Transactional
    public void addPattern(Long classId, ClassSchedulePattern pattern) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course class not found"));
        pattern.setCourseClass(cc);

        if (pattern.getFromWeek() == null)
            pattern.setFromWeek(1);
        if (pattern.getToWeek() == null)
            pattern.setToWeek(15);

        // Remove existing patterns for same day/class that overlap this week range
        List<ClassSchedulePattern> toDelete = patternRepository.findByCourseClassId(classId).stream()
                .filter(p -> p.getDayOfWeek().equals(pattern.getDayOfWeek()))
                .filter(p -> (p.getFromWeek() >= pattern.getFromWeek() && p.getFromWeek() <= pattern.getToWeek()) ||
                        (p.getToWeek() >= pattern.getFromWeek() && p.getToWeek() <= pattern.getToWeek()) ||
                        (pattern.getFromWeek() >= p.getFromWeek() && pattern.getFromWeek() <= p.getToWeek()))
                .collect(Collectors.toList());

        if (!toDelete.isEmpty()) {
            patternRepository.deleteAll(toDelete);
            patternRepository.flush();
        }

        patternRepository.save(pattern);
        patternRepository.flush();

        // Cập nhật thông tin dự kiến của lớp học phần nếu mẫu có thông tin
        if (pattern.getLecturer() != null) {
            cc.setLecturer(pattern.getLecturer());
        }
        if (pattern.getRoomName() != null && !pattern.getRoomName().equals("Chưa xếp")) {
            cc.setExpectedRoom(pattern.getRoomName());
        }
        courseClassRepository.save(cc);

        // Automatically generate instances
        generateInstances(classId);
    }

    @Transactional
    public void addPatternsBulk(Long classId, List<ClassSchedulePattern> patterns) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course class not found"));

        for (ClassSchedulePattern pattern : patterns) {
            pattern.setCourseClass(cc);
            if (pattern.getFromWeek() == null)
                pattern.setFromWeek(1);
            if (pattern.getToWeek() == null)
                pattern.setToWeek(15);

            // Xóa trùng lặp
            List<ClassSchedulePattern> toDelete = patternRepository.findByCourseClassId(classId).stream()
                    .filter(p -> p.getDayOfWeek().equals(pattern.getDayOfWeek()))
                    .filter(p -> (p.getFromWeek() >= pattern.getFromWeek() && p.getFromWeek() <= pattern.getToWeek()) ||
                            (p.getToWeek() >= pattern.getFromWeek() && p.getToWeek() <= pattern.getToWeek()) ||
                            (pattern.getFromWeek() >= p.getFromWeek() && pattern.getFromWeek() <= p.getToWeek()))
                    .collect(Collectors.toList());

            if (!toDelete.isEmpty()) {
                patternRepository.deleteAll(toDelete);
                patternRepository.flush();
            }

            patternRepository.save(pattern);

            if (pattern.getLecturer() != null) {
                cc.setLecturer(pattern.getLecturer());
            }
            if (pattern.getRoomName() != null && !pattern.getRoomName().equals("Chưa xếp")) {
                cc.setExpectedRoom(pattern.getRoomName());
            }
        }

        courseClassRepository.save(cc);
        patternRepository.flush();
        generateInstances(classId);
    }

    @Transactional
    public void generateInstances(Long classId) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course class not found"));

        Semester semester = cc.getSemester();
        if (semester == null || semester.getStartDate() == null || semester.getEndDate() == null) {
            return;
        }

        instanceRepository.deleteByCourseClassId(classId);
        instanceRepository.flush();

        List<ClassSchedulePattern> patterns = patternRepository.findByCourseClassId(classId);
        if (patterns == null || patterns.isEmpty())
            return;

        List<ClassScheduleInstance> newInstances = new ArrayList<>();
        LocalDate startMonday = getMonday(semester.getStartDate());

        for (ClassSchedulePattern pattern : patterns) {
            LocalDate current = semester.getStartDate();
            LocalDate end = semester.getEndDate();

            int targetDay = pattern.getDayOfWeek();

            while (!current.isAfter(end)) {
                int normalizedDay = current.getDayOfWeek().getValue() + 1;
                if (normalizedDay == targetDay) {
                    long daysBetween = ChronoUnit.DAYS.between(startMonday, current);
                    long weeksBetween = Math.floorDiv(daysBetween, 7) + 1;

                    if (weeksBetween >= pattern.getFromWeek() && weeksBetween <= pattern.getToWeek()) {
                        ClassScheduleInstance inst = new ClassScheduleInstance();
                        inst.setCourseClass(cc);
                        inst.setPatternId(pattern.getId());
                        inst.setScheduleDate(current);
                        inst.setStartPeriod(pattern.getStartPeriod());
                        inst.setEndPeriod(pattern.getEndPeriod());
                        inst.setStartTime(pattern.getStartTime());
                        inst.setEndTime(pattern.getEndTime());
                        inst.setRoomName(pattern.getRoomName());
                        inst.setLecturer(pattern.getLecturer() != null ? pattern.getLecturer() : cc.getLecturer());
                        inst.setType(pattern.getSessionType());
                        inst.setStatus("PLANNED");
                        newInstances.add(inst);
                    }
                }
                current = current.plusDays(1);
            }
        }
        instanceRepository.saveAll(newInstances);
    }

    public List<com.example.demo.dto.ClassScheduleInstanceDTO> getScheduleByClass(Long classId) {
        List<ClassScheduleInstance> instances = instanceRepository.findByCourseClassId(classId);
        return instances.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<com.example.demo.dto.ClassScheduleInstanceDTO> getStudentSchedule(Long studentId, Long semesterId) {
        List<CourseClass.ClassStatus> activeStatuses = java.util.Arrays.asList(
                CourseClass.ClassStatus.CLOSED);
        List<ClassScheduleInstance> instances = instanceRepository.findByStudentIdAndSemesterIdAndStatusIn(studentId,
                semesterId, activeStatuses);
        return instances.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<com.example.demo.dto.ClassScheduleInstanceDTO> getLecturerSchedule(Long lecturerId, Long semesterId) {
        List<CourseClass.ClassStatus> activeStatuses = java.util.Arrays.asList(
                CourseClass.ClassStatus.CLOSED);
        // Assuming schedules are also generated based on OPEN_REGISTRATION, FULL,
        // CLOSED statuses similar to students.
        List<ClassScheduleInstance> instances = instanceRepository.findByLecturerIdAndSemesterIdAndStatusIn(lecturerId,
                semesterId, activeStatuses);
        return instances.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public SessionDetailDTO getScheduleInstanceDetail(Long instanceId) {
        ClassScheduleInstance inst = instanceRepository.findById(instanceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học (Session not found)"));

        SessionDetailDTO detail = new SessionDetailDTO();
        detail.setId(inst.getId());
        detail.setScheduleDate(inst.getScheduleDate());
        detail.setStartPeriod(inst.getStartPeriod());
        detail.setEndPeriod(inst.getEndPeriod());
        detail.setStartTime(inst.getStartTime());
        detail.setEndTime(inst.getEndTime());
        detail.setRoomName(inst.getRoomName());

        if (inst.getCourseClass() != null) {
            detail.setClassId(inst.getCourseClass().getId());
            detail.setClassCode(inst.getCourseClass().getClassCode());
            if (inst.getCourseClass().getSubject() != null) {
                detail.setSubjectName(inst.getCourseClass().getSubject().getName());
            }

            // Get attendance session if exists
            final AttendanceSession session = attendanceSessionRepository.findByScheduleInstanceId(inst.getId()).orElse(null);
            if (session != null) {
                detail.setAttendanceActive(session.getIsActive());
                detail.setAttendanceCode(session.getAttendanceCode());
                detail.setClosedAt(session.getClosedAt());
            }

            // Fetch students
            List<CourseRegistration> registrations = registrationRepository
                    .findByCourseClassId(inst.getCourseClass().getId());
            List<StudentDTO> studentDTOs = registrations.stream()
                    .map(reg -> convertStudentToDTO(reg.getStudent(), inst.getCourseClass(), session))
                    .collect(Collectors.toList());
            detail.setStudents(studentDTOs);
        }

        if (inst.getLecturer() != null && inst.getLecturer().getUser() != null) {
            detail.setLecturerName(inst.getLecturer().getUser().getFullName());
        } else if (inst.getCourseClass() != null && inst.getCourseClass().getLecturer() != null
                && inst.getCourseClass().getLecturer().getUser() != null) {
            detail.setLecturerName(inst.getCourseClass().getLecturer().getUser().getFullName());
        }

        return detail;
    }

    private StudentDTO convertStudentToDTO(StudentProfile student, CourseClass courseClass, AttendanceSession session) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getUserId());
        dto.setStudentCode(student.getStudentCode());
        if (student.getUser() != null) {
            dto.setFullName(student.getUser().getFullName());
            dto.setFirstName(student.getUser().getFirstName());
            dto.setLastName(student.getUser().getLastName());
        }

        if (student.getAdministrativeClass() != null) {
            dto.setClassName(student.getAdministrativeClass().getClassCode());
            dto.setClassId(student.getAdministrativeClass().getId());
        }

        dto.setEnrollmentYear(student.getEnrollmentYear());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setStatus(student.getStatus() != null ? student.getStatus().name() : null);

        if (courseClass != null && courseClass.getSubject() != null) {
            Integer absentPeriods = attendanceRepository.sumAbsentPeriodsByStudentAndCourseClass(student.getUserId(), courseClass.getId());
            Integer absentSessions = attendanceRepository.countAbsentSessionsByStudentAndCourseClass(student.getUserId(), courseClass.getId());
            
            dto.setAbsentPeriods(absentPeriods != null ? absentPeriods : 0);
            dto.setAbsentSessions(absentSessions != null ? absentSessions : 0);
            
            Subject subject = courseClass.getSubject();
            Integer totalPeriods = (subject.getTheoryPeriods() != null ? subject.getTheoryPeriods() : 0) + 
                                   (subject.getPracticalPeriods() != null ? subject.getPracticalPeriods() : 0);
            
            if (totalPeriods > 0) {
                double percent = (dto.getAbsentPeriods() * 100.0) / totalPeriods;
                dto.setAbsentPercent(Math.round(percent * 100.0) / 100.0);
            } else {
                dto.setAbsentPercent(0.0);
            }

            // Check attendance for THIS session
            if (session != null) {
                // Default: no ticks yet until finalized or manually touched
                dto.setSessionAbsentPeriods(0);
                dto.setAbsent(false);
                dto.setPresent(false);
                dto.setExcused(false);
                
                attendanceRepository.findBySessionIdAndStudentUserId(session.getId(), student.getUserId())
                    .ifPresent(a -> {
                        dto.setEnteredCode(a.getStudentEnteredCode());
                        dto.setSelfAttended(a.getStudentEnteredCode() != null && !a.getStudentEnteredCode().isEmpty());
                        
                        // Only show status in UI if session is closed OR if it was manually marked by lecturer
                        // (Manually marked means getStudentEnteredCode is null)
                        if (!session.getIsActive() || a.getStudentEnteredCode() == null) {
                            dto.setAbsent(a.getStatus() == AttendanceStatus.ABSENT);
                            dto.setExcused(a.getStatus() == AttendanceStatus.EXCUSED);
                            dto.setPresent(a.getStatus() == AttendanceStatus.PRESENT);
                            dto.setSessionAbsentPeriods(a.getAbsentPeriods());
                        }
                    });
            }
        } else {
            dto.setAbsentSessions(0);
            dto.setAbsentPeriods(0);
            dto.setAbsentPercent(0.0);
        }

        return dto;
    }

    private com.example.demo.dto.ClassScheduleInstanceDTO convertToDTO(ClassScheduleInstance inst) {
        com.example.demo.dto.ClassScheduleInstanceDTO dto = new com.example.demo.dto.ClassScheduleInstanceDTO();
        dto.setId(inst.getId());
        dto.setScheduleDate(inst.getScheduleDate());
        dto.setStartTime(inst.getStartTime());
        dto.setEndTime(inst.getEndTime());
        dto.setStartPeriod(inst.getStartPeriod());
        dto.setEndPeriod(inst.getEndPeriod());
        dto.setRoomName(inst.getRoomName());
        dto.setType(inst.getType());
        dto.setStatus(inst.getStatus());
        dto.setPatternId(inst.getPatternId());

        if (inst.getCourseClass() != null) {
            dto.setClassId(inst.getCourseClass().getId());
            dto.setClassCode(inst.getCourseClass().getClassCode());
            if (inst.getCourseClass().getSubject() != null) {
                dto.setSubjectName(inst.getCourseClass().getSubject().getName());
                dto.setSubjectId(inst.getCourseClass().getSubject().getId());
            }
        }

        if (inst.getLecturer() != null && inst.getLecturer().getUser() != null) {
            dto.setLecturerName(inst.getLecturer().getUser().getFullName());
        } else if (inst.getCourseClass() != null && inst.getCourseClass().getLecturer() != null
                && inst.getCourseClass().getLecturer().getUser() != null) {
            dto.setLecturerName(inst.getCourseClass().getLecturer().getUser().getFullName());
        }

        return dto;
    }

    private LocalDate getMonday(LocalDate date) {
        int day = date.getDayOfWeek().getValue(); // 1=Mon, 7=Sun
        if (day != 1) {
            return date.plusDays(8 - day);
        }
        return date;
    }

    @Transactional
    public void deletePattern(Long patternId) {
        ClassSchedulePattern pattern = patternRepository.findById(patternId).orElse(null);
        if (pattern != null) {
            Long classId = pattern.getCourseClass().getId();
            patternRepository.delete(pattern);
            patternRepository.flush();
            generateInstances(classId);
        }
    }

    @Transactional
    public void deletePatternSingle(Long patternId, Integer week) {
        ClassSchedulePattern pattern = patternRepository.findById(patternId).orElse(null);
        if (pattern != null) {
            Long classId = pattern.getCourseClass().getId();

            if (pattern.getFromWeek().equals(week) && pattern.getToWeek().equals(week)) {
                patternRepository.delete(pattern);
            } else if (pattern.getFromWeek().equals(week)) {
                pattern.setFromWeek(week + 1);
                patternRepository.save(pattern);
            } else if (pattern.getToWeek().equals(week)) {
                pattern.setToWeek(week - 1);
                patternRepository.save(pattern);
            } else if (week > pattern.getFromWeek() && week < pattern.getToWeek()) {
                ClassSchedulePattern newPattern = new ClassSchedulePattern();
                newPattern.setCourseClass(pattern.getCourseClass());
                newPattern.setDayOfWeek(pattern.getDayOfWeek());
                newPattern.setStartPeriod(pattern.getStartPeriod());
                newPattern.setEndPeriod(pattern.getEndPeriod());
                newPattern.setRoomName(pattern.getRoomName());
                newPattern.setLecturer(pattern.getLecturer());
                newPattern.setSessionType(pattern.getSessionType());

                newPattern.setFromWeek(week + 1);
                newPattern.setToWeek(pattern.getToWeek());

                pattern.setToWeek(week - 1);
                patternRepository.save(pattern);
                patternRepository.save(newPattern);
            }
            patternRepository.flush();
            generateInstances(classId);
        }
    }

    @Transactional
    public void deletePatternForward(Long patternId, Integer week) {
        ClassSchedulePattern refPattern = patternRepository.findById(patternId).orElse(null);
        if (refPattern != null) {
            Long classId = refPattern.getCourseClass().getId();
            int dayOfWeek = refPattern.getDayOfWeek();
            int startPeriod = refPattern.getStartPeriod();

            List<ClassSchedulePattern> toDelete = patternRepository.findByCourseClassId(classId).stream()
                    .filter(p -> p.getDayOfWeek().equals(dayOfWeek) && p.getStartPeriod().equals(startPeriod))
                    .collect(Collectors.toList());

            patternRepository.deleteAll(toDelete);
            patternRepository.flush();
            generateInstances(classId);
        }
    }

    @Transactional
    public void updatePattern(Long patternId, Integer startPeriod, Integer endPeriod, String roomName,
            String lecturerName) {
        ClassSchedulePattern pattern = patternRepository.findById(patternId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch mẫu (Pattern not found)"));

        pattern.setStartPeriod(startPeriod);
        pattern.setEndPeriod(endPeriod);

        if (roomName != null && !roomName.trim().isEmpty()) {
            pattern.setRoomName(roomName.trim());
        } else {
            pattern.setRoomName(null);
        }

        if (lecturerName != null && !lecturerName.trim().isEmpty()) {
            LecturerProfile lecturer = lecturerRepository.findByUserFullName(lecturerName.trim());
            if (lecturer != null) {
                pattern.setLecturer(lecturer);
            } else {
                pattern.setLecturer(null);
            }
        } else {
            pattern.setLecturer(null);
        }

        patternRepository.save(pattern);
        patternRepository.flush();

        // Cập nhật thông tin dự kiến của lớp học phần - chỉ cập nhật nếu mẫu có giá trị
        CourseClass cc = pattern.getCourseClass();
        if (pattern.getLecturer() != null) {
            cc.setLecturer(pattern.getLecturer());
        }
        if (pattern.getRoomName() != null && !pattern.getRoomName().equals("Chưa xếp")) {
            cc.setExpectedRoom(pattern.getRoomName());
        }
        courseClassRepository.save(cc);

        generateInstances(cc.getId());
    }

    public List<ConflictInfo> checkConflicts(Long classId) {
        List<ClassScheduleInstance> classInstances = instanceRepository.findByCourseClassId(classId);
        List<ConflictInfo> conflicts = new ArrayList<>();

        for (ClassScheduleInstance inst : classInstances) {
            if (inst.getRoomName() != null && !inst.getRoomName().isEmpty()) {
                List<ClassScheduleInstance> roomOccurrences = instanceRepository.findByRoomNameAndScheduleDate(
                        inst.getRoomName(), inst.getScheduleDate());

                for (ClassScheduleInstance other : roomOccurrences) {
                    if (!other.getCourseClass().getId().equals(classId) && timeOverlaps(inst, other)) {
                        conflicts.add(new ConflictInfo("ROOM",
                                String.format("Phòng %s bị trùng vào ngày %s (%s-%s) với lớp %s",
                                        inst.getRoomName(), inst.getScheduleDate(), inst.getStartPeriod(),
                                        inst.getEndPeriod(), other.getCourseClass().getClassCode())));
                    }
                }
            }

            if (inst.getLecturer() != null) {
                List<ClassScheduleInstance> lecturerOccurrences = instanceRepository
                        .findByLecturerUserIdAndScheduleDate(
                                inst.getLecturer().getUserId(), inst.getScheduleDate());

                for (ClassScheduleInstance other : lecturerOccurrences) {
                    if (!other.getCourseClass().getId().equals(classId) && timeOverlaps(inst, other)) {
                        conflicts.add(new ConflictInfo("LECTURER",
                                String.format("Giảng viên %s bị trùng lịch vào ngày %s (%s-%s) với lớp %s",
                                        inst.getLecturer().getUser().getFullName(), inst.getScheduleDate(),
                                        inst.getStartPeriod(), inst.getEndPeriod(),
                                        other.getCourseClass().getClassCode())));
                    }
                }
            }
        }
        return conflicts.stream().distinct().collect(Collectors.toList());
    }

    private boolean timeOverlaps(ClassScheduleInstance i1, ClassScheduleInstance i2) {
        return Math.max(i1.getStartPeriod(), i2.getStartPeriod()) <= Math.min(i1.getEndPeriod(), i2.getEndPeriod());
    }

    public static class ConflictInfo {
        private String type;
        private String content;

        public ConflictInfo(String type, String content) {
            this.type = type;
            this.content = content;
        }

        public String getType() {
            return type;
        }

        public String getContent() {
            return content;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (o == null || getClass() != o.getClass())
                return false;
            ConflictInfo that = (ConflictInfo) o;
            return type.equals(that.type) && content.equals(that.content);
        }

        @Override
        public int hashCode() {
            int result = type.hashCode();
            result = 31 * result + content.hashCode();
            return result;
        }
    }
    @Transactional
    public AttendanceSession openAttendanceSession(Long instanceId, String code) {
        ClassScheduleInstance inst = instanceRepository.findById(instanceId)
            .orElseThrow(() -> new RuntimeException("Instance not found"));
        
        AttendanceSession session = attendanceSessionRepository.findByScheduleInstanceId(instanceId)
            .orElse(new AttendanceSession());
        
        session.setScheduleInstance(inst);
        session.setAttendanceCode(code);
        session.setTotalPeriods(inst.getEndPeriod() - inst.getStartPeriod() + 1);
        session.setIsActive(true);
        session.setOpenedAt(java.time.LocalDateTime.now());
        
        return attendanceSessionRepository.save(session);
    }

    @Transactional
    public void submitManualAttendance(AttendanceSubmitDTO dto) {
        AttendanceSession session = attendanceSessionRepository.findByScheduleInstanceId(dto.getScheduleInstanceId())
            .orElseGet(() -> {
                ClassScheduleInstance inst = instanceRepository.findById(dto.getScheduleInstanceId())
                    .orElseThrow(() -> new RuntimeException("Instance not found"));
                AttendanceSession s = new AttendanceSession();
                s.setScheduleInstance(inst);
                s.setAttendanceCode(""); // Mã để trống
                s.setTotalPeriods(inst.getEndPeriod() - inst.getStartPeriod() + 1);
                s.setIsActive(false);
                s.setClosedAt(java.time.LocalDateTime.now());
                return attendanceSessionRepository.save(s);
            });

        // Also update existing session if it was previously open
        if (session.getIsActive()) {
            session.setIsActive(false);
            session.setClosedAt(java.time.LocalDateTime.now());
            attendanceSessionRepository.save(session);
        }

        for (AttendanceSubmitDTO.AttendanceRecord record : dto.getRecords()) {
            Attendance attendance = attendanceRepository.findBySessionIdAndStudentUserId(session.getId(), record.getStudentId())
                .orElse(new Attendance());
            
            attendance.setSession(session);
            attendance.setStudent(studentRepository.findById(record.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found: " + record.getStudentId())));
            attendance.setStatus(record.getStatus());
            attendance.setAbsentPeriods(record.getAbsentPeriods());
            attendance.setMarkedAt(java.time.LocalDateTime.now());
            // This is now a manual handle, clear any previously entered student codes
            attendance.setStudentEnteredCode(null);
            
            attendanceRepository.save(attendance);
        }
        
        // Recalculate scores for all students in this class
        recalculateAttendanceScores(session.getScheduleInstance().getCourseClass().getId());
    }

    private void recalculateAttendanceScores(Long courseClassId) {
        List<CourseRegistration> registrations = registrationRepository.findByCourseClassId(courseClassId);
        for (CourseRegistration reg : registrations) {
            CourseClass courseClass = reg.getCourseClass();
            Subject subject = courseClass.getSubject();
            
            Integer totalAbsentPeriods = attendanceRepository.sumAbsentPeriodsByStudentAndCourseClass(reg.getStudent().getUserId(), courseClassId);
            if (totalAbsentPeriods == null) totalAbsentPeriods = 0;
            
            int totalSubjectPeriods = (subject.getTheoryPeriods() != null ? subject.getTheoryPeriods() : 0) + 
                                     (subject.getPracticalPeriods() != null ? subject.getPracticalPeriods() : 0);
            
            double attendanceScore = 10.0;
            if (totalSubjectPeriods > 0) {
                attendanceScore = 10.0 * (1.0 - (double)totalAbsentPeriods / totalSubjectPeriods);
                if (attendanceScore < 0) attendanceScore = 0;
            }
            
            reg.setAttendanceScore(Math.round(attendanceScore * 10.0) / 10.0);
            
            // Recompute total score
            double total = reg.getAttendanceScore() * courseClass.getAttendanceWeight() +
                          reg.getMidtermScore() * courseClass.getMidtermWeight() +
                          reg.getFinalScore() * courseClass.getFinalWeight();
            reg.setTotalScore(Math.round(total * 100.0) / 100.0);
            reg.setScoreUpdatedAt(java.time.LocalDateTime.now());
            
            registrationRepository.save(reg);
        }
    }

    @Transactional
    public void selfAttend(String code, Long studentId, Long instanceId) {
        AttendanceSession session = attendanceSessionRepository.findByScheduleInstanceId(instanceId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên điểm danh cho buổi học này (No session for this instance)"));

        if (!session.getIsActive()) {
            throw new RuntimeException("Phiên điểm danh đã đóng (Attendance session is closed)");
        }

        Attendance attendance = attendanceRepository.findBySessionIdAndStudentUserId(session.getId(), studentId)
            .orElse(new Attendance());
        
        attendance.setSession(session);
        attendance.setStudent(studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found")));
        
        // Save the code entered by student
        attendance.setStudentEnteredCode(code);
        attendance.setMarkedAt(java.time.LocalDateTime.now());
        
        // Student is ALWAYS marked as ABSENT when they enter a code. 
        // Comparison only happens when lecturer finalizes the session.
        attendance.setStatus(AttendanceStatus.ABSENT);
        attendance.setAbsentPeriods(session.getTotalPeriods());
        
        attendanceRepository.save(attendance);
    }

    @Transactional
    public void finalizeAutoAttendance(Long instanceId) {
        AttendanceSession session = attendanceSessionRepository.findByScheduleInstanceId(instanceId)
            .orElseThrow(() -> new RuntimeException("No attendance session found for this instance"));
        
        // Mark session as inactive
        session.setIsActive(false);
        session.setClosedAt(java.time.LocalDateTime.now());
        attendanceSessionRepository.save(session);
        
        // Process all students in the class
        List<CourseRegistration> registrations = registrationRepository.findByCourseClassId(session.getScheduleInstance().getCourseClass().getId());
        for (CourseRegistration reg : registrations) {
            Attendance att = attendanceRepository.findBySessionIdAndStudentUserId(session.getId(), reg.getStudent().getUserId())
                .orElse(null);
            
            if (att == null) {
                // Not attended at all -> ABSENT
                att = new Attendance();
                att.setSession(session);
                att.setStudent(reg.getStudent());
                att.setStatus(AttendanceStatus.ABSENT);
                att.setAbsentPeriods(session.getTotalPeriods());
                att.setMarkedAt(java.time.LocalDateTime.now());
                attendanceRepository.save(att);
            } else {
                // Checking the code entered
                if (att.getStudentEnteredCode() != null && att.getStudentEnteredCode().equals(session.getAttendanceCode())) {
                    att.setStatus(AttendanceStatus.PRESENT);
                    att.setAbsentPeriods(0);
                } else if (att.getStatus() == AttendanceStatus.PRESENT && att.getStudentEnteredCode() == null) {
                     // Keep as is if manually marked present by lecturer earlier (if we allow that)
                } else {
                    // Mismatched code -> ABSENT
                    att.setStatus(AttendanceStatus.ABSENT);
                    att.setAbsentPeriods(session.getTotalPeriods());
                }
                att.setMarkedAt(java.time.LocalDateTime.now());
                attendanceRepository.save(att);
            }
        }
        
        // Final recalculation after closing session
        recalculateAttendanceScores(session.getScheduleInstance().getCourseClass().getId());
    }
}
