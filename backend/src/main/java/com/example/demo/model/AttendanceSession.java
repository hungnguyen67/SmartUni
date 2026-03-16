package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_sessions")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AttendanceSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_instance_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ClassScheduleInstance scheduleInstance;

    @Column(name = "attendance_code", nullable = false)
    private String attendanceCode;

    @Column(name = "total_periods", nullable = false)
    private Integer totalPeriods;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "opened_at")
    private LocalDateTime openedAt = LocalDateTime.now();

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public AttendanceSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ClassScheduleInstance getScheduleInstance() { return scheduleInstance; }
    public void setScheduleInstance(ClassScheduleInstance scheduleInstance) { this.scheduleInstance = scheduleInstance; }

    public String getAttendanceCode() { return attendanceCode; }
    public void setAttendanceCode(String attendanceCode) { this.attendanceCode = attendanceCode; }

    public Integer getTotalPeriods() { return totalPeriods; }
    public void setTotalPeriods(Integer totalPeriods) { this.totalPeriods = totalPeriods; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
