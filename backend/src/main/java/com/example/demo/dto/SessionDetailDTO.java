package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class SessionDetailDTO {
    private Long id;
    private Long classId;
    private String subjectName;
    private String classCode;
    private LocalDate scheduleDate;
    private Integer startPeriod;
    private Integer endPeriod;
    private LocalTime startTime;
    private LocalTime endTime;
    private String roomName;
    private String lecturerName;
    private List<StudentDTO> students;
    private boolean attendanceActive;
    private String attendanceCode;
    private java.time.LocalDateTime closedAt;

    public SessionDetailDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }

    public LocalDate getScheduleDate() { return scheduleDate; }
    public void setScheduleDate(LocalDate scheduleDate) { this.scheduleDate = scheduleDate; }

    public Integer getStartPeriod() { return startPeriod; }
    public void setStartPeriod(Integer startPeriod) { this.startPeriod = startPeriod; }

    public Integer getEndPeriod() { return endPeriod; }
    public void setEndPeriod(Integer endPeriod) { this.endPeriod = endPeriod; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getLecturerName() { return lecturerName; }
    public void setLecturerName(String lecturerName) { this.lecturerName = lecturerName; }

    public List<StudentDTO> getStudents() { return students; }
    public void setStudents(List<StudentDTO> students) { this.students = students; }

    public boolean isAttendanceActive() { return attendanceActive; }
    public void setAttendanceActive(boolean attendanceActive) { this.attendanceActive = attendanceActive; }

    public String getAttendanceCode() { return attendanceCode; }
    public void setAttendanceCode(String attendanceCode) { this.attendanceCode = attendanceCode; }

    public java.time.LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(java.time.LocalDateTime closedAt) { this.closedAt = closedAt; }
}
