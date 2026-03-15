package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.ClassScheduleInstanceRepository;
import com.example.demo.repository.ClassSchedulePatternRepository;
import com.example.demo.repository.CourseClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
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
    private EntityManager entityManager;

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
        // This ensures CLEAN replacement
        List<ClassSchedulePattern> existingPatterns = patternRepository.findByCourseClassId(classId);
        existingPatterns.stream()
                .filter(p -> p.getDayOfWeek().equals(pattern.getDayOfWeek()))
                .filter(p -> (p.getFromWeek() >= pattern.getFromWeek() && p.getFromWeek() <= pattern.getToWeek()) ||
                        (p.getToWeek() >= pattern.getFromWeek() && p.getToWeek() <= pattern.getToWeek()) ||
                        (pattern.getFromWeek() >= p.getFromWeek() && pattern.getFromWeek() <= p.getToWeek()))
                .forEach(p -> patternRepository.delete(p));

        patternRepository.flush(); // Ensure deletions are sent to DB

        patternRepository.save(pattern);
        patternRepository.flush(); // IMPORTANT: Ensure ID is generated before generating instances

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
        
        List<ClassSchedulePattern> existingPatterns = patternRepository.findByCourseClassId(classId);

        for (ClassSchedulePattern pattern : patterns) {
            pattern.setCourseClass(cc);
            if (pattern.getFromWeek() == null) pattern.setFromWeek(1);
            if (pattern.getToWeek() == null) pattern.setToWeek(15);

            // Xóa trùng lặp
            existingPatterns.stream()
                .filter(p -> p.getDayOfWeek().equals(pattern.getDayOfWeek()))
                .filter(p -> (p.getFromWeek() >= pattern.getFromWeek() && p.getFromWeek() <= pattern.getToWeek()) ||
                             (p.getToWeek() >= pattern.getFromWeek() && p.getToWeek() <= pattern.getToWeek()) ||
                             (pattern.getFromWeek() >= p.getFromWeek() && pattern.getFromWeek() <= p.getToWeek()))
                .forEach(p -> patternRepository.delete(p));
            
            patternRepository.save(pattern);

            // Cập nhật thông tin dự kiến từ mẫu - chỉ cập nhật nếu có giá trị
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
            throw new RuntimeException("Semester dates not fully defined");
        }

        List<ClassScheduleInstance> existing = instanceRepository.findByCourseClassId(classId);
        instanceRepository.deleteAll(existing);
        instanceRepository.flush(); // Ensure delete is executed

        entityManager.refresh(cc); // Ensure we have latest patterns
        List<ClassSchedulePattern> patterns = cc.getSchedules();
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
                    long weeksBetween = ChronoUnit.WEEKS.between(startMonday, current) + 1;

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
        return date.minusDays(day - 1);
    }

    @Transactional
    public void deletePattern(Long patternId) {
        ClassSchedulePattern pattern = entityManager.find(ClassSchedulePattern.class, patternId);
        if (pattern != null) {
            Long classId = pattern.getCourseClass().getId();
            entityManager.remove(pattern);
            entityManager.flush();
            generateInstances(classId); // Regenerate after removal
        }
    }

    @Transactional
    public void deletePatternSingle(Long patternId, Integer week) {
        ClassSchedulePattern pattern = entityManager.find(ClassSchedulePattern.class, patternId);
        if (pattern != null) {
            Long classId = pattern.getCourseClass().getId();

            if (pattern.getFromWeek().equals(week) && pattern.getToWeek().equals(week)) {
                entityManager.remove(pattern);
            } else if (pattern.getFromWeek().equals(week)) {
                pattern.setFromWeek(week + 1);
                entityManager.merge(pattern);
            } else if (pattern.getToWeek().equals(week)) {
                pattern.setToWeek(week - 1);
                entityManager.merge(pattern);
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
                entityManager.merge(pattern);
                entityManager.persist(newPattern);
            }
            entityManager.flush();
            generateInstances(classId);
        }
    }

    @Transactional
    public void deletePatternForward(Long patternId, Integer week) {
        ClassSchedulePattern refPattern = entityManager.find(ClassSchedulePattern.class, patternId);
        if (refPattern != null) {
            CourseClass cc = refPattern.getCourseClass();
            int dayOfWeek = refPattern.getDayOfWeek();
            int startPeriod = refPattern.getStartPeriod();

            // Xóa tất cả các pattern trùng Thứ và Tiết bắt đầu (xóa toàn bộ tiến độ của buổi đó)
            cc.getSchedules().removeIf(p -> p.getDayOfWeek().equals(dayOfWeek) && p.getStartPeriod().equals(startPeriod));

            patternRepository.flush();
            generateInstances(cc.getId());
        }
    }

    @Transactional
    public void updatePattern(Long patternId, Integer startPeriod, Integer endPeriod, String roomName,
            String lecturerName) {
        ClassSchedulePattern pattern = patternRepository.findById(patternId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch mẫu (Pattern not found)"));

        pattern.setStartPeriod(startPeriod);
        pattern.setEndPeriod(endPeriod);
        pattern.setRoomName(roomName);

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
}
