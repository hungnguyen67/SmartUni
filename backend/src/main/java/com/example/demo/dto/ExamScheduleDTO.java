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
    private String proctorName;
    private String proctorCode;
    private String proctorEmail;
    private Long proctorId;
    private List<Long> proctorIds;
    private String createdByName;

    private List<RoomInfo> rooms;
    private List<SlotInfo> slots;
    private List<StudentExamInfo> assignedStudents;

    public static class StudentExamInfo {
        private Long id;
        private String studentCode;
        private String fullName;
        private String className;
        private String roomName;
        private LocalTime examTime;
        private Integer examSlot;
        private String proctorName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getStudentCode() { return studentCode; }
        public void setStudentCode(String studentCode) { this.studentCode = studentCode; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public LocalTime getExamTime() { return examTime; }
        public void setExamTime(LocalTime examTime) { this.examTime = examTime; }
        public Integer getExamSlot() { return examSlot; }
        public void setExamSlot(Integer examSlot) { this.examSlot = examSlot; }
        public String getProctorName() { return proctorName; }
        public void setProctorName(String proctorName) { this.proctorName = proctorName; }
    }

    public static class CourseClassInfo {
        private Long id;
        private String classCode;
        private String className;
        private String subjectCode;
        private String subjectName;
        private Integer currentEnrolled;
        private Long semesterId;
        private String semesterName;
        private Integer cohort;
        private Long subjectId;
        private Long targetClassId;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getClassCode() { return classCode; }
        public void setClassCode(String classCode) { this.classCode = classCode; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getSubjectCode() { return subjectCode; }
        public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
        public String getSubjectName() { return subjectName; }
        public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
        public Integer getCurrentEnrolled() { return currentEnrolled; }
        public void setCurrentEnrolled(Integer currentEnrolled) { this.currentEnrolled = currentEnrolled; }
        public Long getSemesterId() { return semesterId; }
        public void setSemesterId(Long semesterId) { this.semesterId = semesterId; }
        public String getSemesterName() { return semesterName; }
        public void setSemesterName(String semesterName) { this.semesterName = semesterName; }
        public Integer getCohort() { return cohort; }
        public void setCohort(Integer cohort) { this.cohort = cohort; }
        public Long getSubjectId() { return subjectId; }
        public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
        public Long getTargetClassId() { return targetClassId; }
        public void setTargetClassId(Long targetClassId) { this.targetClassId = targetClassId; }
    }

    public static class RoomInfo {
        private String roomName;
        private Integer capacity;
        private Long proctorId;

        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }
        public Long getProctorId() { return proctorId; }
        public void setProctorId(Long proctorId) { this.proctorId = proctorId; }
    }

    public static class SlotInfo {
        private Integer slotNo;
        private LocalTime startTime;
        private LocalTime endTime;

        public Integer getSlotNo() { return slotNo; }
        public void setSlotNo(Integer slotNo) { this.slotNo = slotNo; }
        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
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
    public String getProctorName() { return proctorName; }
    public void setProctorName(String proctorName) { this.proctorName = proctorName; }
    public String getProctorCode() { return proctorCode; }
    public void setProctorCode(String proctorCode) { this.proctorCode = proctorCode; }
    public String getProctorEmail() { return proctorEmail; }
    public void setProctorEmail(String proctorEmail) { this.proctorEmail = proctorEmail; }
    public Long getProctorId() { return proctorId; }
    public void setProctorId(Long proctorId) { this.proctorId = proctorId; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public List<Long> getProctorIds() { return proctorIds; }
    public void setProctorIds(List<Long> proctorIds) { this.proctorIds = proctorIds; }
    
    public List<RoomInfo> getRooms() { return rooms; }
    public void setRooms(List<RoomInfo> rooms) { this.rooms = rooms; }
    public List<SlotInfo> getSlots() { return slots; }
    public void setSlots(List<SlotInfo> slots) { this.slots = slots; }
    public List<StudentExamInfo> getAssignedStudents() { return assignedStudents; }
    public void setAssignedStudents(List<StudentExamInfo> assignedStudents) { this.assignedStudents = assignedStudents; }
}
