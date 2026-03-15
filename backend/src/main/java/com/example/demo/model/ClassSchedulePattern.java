package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_schedule_patterns")
public class ClassSchedulePattern {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "course_class_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private CourseClass courseClass;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "start_period", nullable = false)
    private Integer startPeriod;

    @Column(name = "end_period", nullable = false)
    private Integer endPeriod;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "room_name", length = 50)
    private String roomName;

    @ManyToOne
    @JoinColumn(name = "lecturer_id")
    private LecturerProfile lecturer;

    @Column(name = "from_week", nullable = false)
    private Integer fromWeek;

    @Column(name = "to_week", nullable = false)
    private Integer toWeek;

    @Column(name = "session_type")
    private String sessionType = "THEORY";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ClassSchedulePattern() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CourseClass getCourseClass() { return courseClass; }
    public void setCourseClass(CourseClass courseClass) { this.courseClass = courseClass; }
    public Integer getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Integer dayOfWeek) { this.dayOfWeek = dayOfWeek; }
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
    public LecturerProfile getLecturer() { return lecturer; }
    public void setLecturer(LecturerProfile lecturer) { this.lecturer = lecturer; }
    public Integer getFromWeek() { return fromWeek; }
    public void setFromWeek(Integer fromWeek) { this.fromWeek = fromWeek; }
    public Integer getToWeek() { return toWeek; }
    public void setToWeek(Integer toWeek) { this.toWeek = toWeek; }
    public String getSessionType() { return sessionType; }
    public void setSessionType(String sessionType) { this.sessionType = sessionType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
