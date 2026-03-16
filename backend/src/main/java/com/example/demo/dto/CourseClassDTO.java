package com.example.demo.dto;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class CourseClassDTO {
    private Long id;
    private String classCode;
    private Long subjectId;
    private Long lecturerId;
    private Long targetClassId;
    private String targetClassName;
    private String subjectName;
    private String subjectCode;
    private Integer credits;
    private String lecturerName;
    private Integer maxStudents;
    private Integer currentEnrolled;
    private String classStatus;
    private LocalDateTime registrationStart;
    private LocalDateTime registrationEnd;
    private Double attendanceWeight;
    private Double midtermWeight;
    private Double finalWeight;
    private Integer theoryPeriods;
    private Integer practicalPeriods;
    private String expectedRoom;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<ScheduleDTO> schedules;

    public static class ScheduleDTO {
        private Integer dayOfWeek;
        private Integer startPeriod;
        private Integer endPeriod;
        private LocalTime startTime;
        private LocalTime endTime;
        private String roomName;
        private String sessionType;

        public ScheduleDTO() {
        }

        public ScheduleDTO(Integer dayOfWeek, Integer startPeriod, Integer endPeriod, LocalTime startTime, LocalTime endTime, String roomName,
                String sessionType) {
            this.dayOfWeek = dayOfWeek;
            this.startPeriod = startPeriod;
            this.endPeriod = endPeriod;
            this.startTime = startTime;
            this.endTime = endTime;
            this.roomName = roomName;
            this.sessionType = sessionType;
        }

        public Integer getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(Integer dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public Integer getStartPeriod() {
            return startPeriod;
        }

        public void setStartPeriod(Integer startPeriod) {
            this.startPeriod = startPeriod;
        }

        public Integer getEndPeriod() {
            return endPeriod;
        }

        public void setEndPeriod(Integer endPeriod) {
            this.endPeriod = endPeriod;
        }

        public LocalTime getStartTime() {
            return startTime;
        }

        public void setStartTime(LocalTime startTime) {
            this.startTime = startTime;
        }

        public LocalTime getEndTime() {
            return endTime;
        }

        public void setEndTime(LocalTime endTime) {
            this.endTime = endTime;
        }

        public String getRoomName() {
            return roomName;
        }

        public void setRoomName(String roomName) {
            this.roomName = roomName;
        }

        public String getSessionType() {
            return sessionType;
        }

        public void setSessionType(String sessionType) {
            this.sessionType = sessionType;
        }
    }

    public CourseClassDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public Long getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(Long lecturerId) {
        this.lecturerId = lecturerId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public String getLecturerName() {
        return lecturerName;
    }

    public void setLecturerName(String lecturerName) {
        this.lecturerName = lecturerName;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = maxStudents;
    }

    public Integer getCurrentEnrolled() {
        return currentEnrolled;
    }

    public void setCurrentEnrolled(Integer currentEnrolled) {
        this.currentEnrolled = currentEnrolled;
    }

    public String getClassStatus() {
        return classStatus;
    }

    public void setClassStatus(String classStatus) {
        this.classStatus = classStatus;
    }

    public LocalDateTime getRegistrationStart() {
        return registrationStart;
    }

    public void setRegistrationStart(LocalDateTime registrationStart) {
        this.registrationStart = registrationStart;
    }

    public LocalDateTime getRegistrationEnd() {
        return registrationEnd;
    }

    public void setRegistrationEnd(LocalDateTime registrationEnd) {
        this.registrationEnd = registrationEnd;
    }

    public Double getAttendanceWeight() {
        return attendanceWeight;
    }

    public void setAttendanceWeight(Double attendanceWeight) {
        this.attendanceWeight = attendanceWeight;
    }

    public Double getMidtermWeight() {
        return midtermWeight;
    }

    public void setMidtermWeight(Double midtermWeight) {
        this.midtermWeight = midtermWeight;
    }

    public Double getFinalWeight() {
        return finalWeight;
    }

    public void setFinalWeight(Double finalWeight) {
        this.finalWeight = finalWeight;
    }

    public List<ScheduleDTO> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<ScheduleDTO> schedules) {
        this.schedules = schedules;
    }

    public Integer getTheoryPeriods() {
        return theoryPeriods;
    }

    public void setTheoryPeriods(Integer theoryPeriods) {
        this.theoryPeriods = theoryPeriods;
    }

    public Integer getPracticalPeriods() {
        return practicalPeriods;
    }

    public void setPracticalPeriods(Integer practicalPeriods) {
        this.practicalPeriods = practicalPeriods;
    }

    public Long getTargetClassId() {
        return targetClassId;
    }

    public void setTargetClassId(Long targetClassId) {
        this.targetClassId = targetClassId;
    }

    public String getExpectedRoom() {
        return expectedRoom;
    }

    public void setExpectedRoom(String expectedRoom) {
        this.expectedRoom = expectedRoom;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getTargetClassName() {
        return targetClassName;
    }

    public void setTargetClassName(String targetClassName) {
        this.targetClassName = targetClassName;
    }

    private String majorName;

    public String getMajorName() {
        return majorName;
    }

    public void setMajorName(String majorName) {
        this.majorName = majorName;
    }
}
