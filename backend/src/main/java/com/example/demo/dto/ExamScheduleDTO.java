package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class ExamScheduleDTO {
    private Long id;
    private CourseClassInfo courseClass;
    private String examType;
    private String examFormat;
    private LocalDate examDate;
    private Integer durationMinutes;
    private LocalTime firstSlotStart;
    private String status;
    private Integer totalStudents;
    private List<RoomInfo> rooms;

    public static class CourseClassInfo {
        private Long id;
        private String classCode;
        private String className;
        private String subjectName;
        private Integer currentEnrolled;
        private Long semesterId;
        private String semesterName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getClassCode() { return classCode; }
        public void setClassCode(String classCode) { this.classCode = classCode; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getSubjectName() { return subjectName; }
        public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
        public Integer getCurrentEnrolled() { return currentEnrolled; }
        public void setCurrentEnrolled(Integer currentEnrolled) { this.currentEnrolled = currentEnrolled; }
        public Long getSemesterId() { return semesterId; }
        public void setSemesterId(Long semesterId) { this.semesterId = semesterId; }
        public String getSemesterName() { return semesterName; }
        public void setSemesterName(String semesterName) { this.semesterName = semesterName; }
    }

    public static class RoomInfo {
        private String roomName;
        private Integer capacity;

        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CourseClassInfo getCourseClass() { return courseClass; }
    public void setCourseClass(CourseClassInfo courseClass) { this.courseClass = courseClass; }
    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }
    public String getExamFormat() { return examFormat; }
    public void setExamFormat(String examFormat) { this.examFormat = examFormat; }
    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public LocalTime getFirstSlotStart() { return firstSlotStart; }
    public void setFirstSlotStart(LocalTime firstSlotStart) { this.firstSlotStart = firstSlotStart; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getTotalStudents() { return totalStudents; }
    public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
    public List<RoomInfo> getRooms() { return rooms; }
    public void setRooms(List<RoomInfo> rooms) { this.rooms = rooms; }
}
