package com.example.demo.model;

import java.io.Serializable;
import java.time.LocalDateTime;
import javax.persistence.*;

@Entity
@Table(name = "student_profiles")
public class StudentProfile implements Serializable {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "student_code", unique = true, nullable = false)
    private String studentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private AdministrativeClass administrativeClass;

    @Column(name = "enrollment_year")
    private Integer enrollmentYear;

    @Column(name = "current_semester")
    private Integer currentSemester = 1;

    @Column(name = "current_gpa")
    private Double currentGpa = 0.0;

    @Column(name = "current_gpa_10")
    private Double currentGpa10 = 0.0;

    @Column(name = "total_credits_earned")
    private Integer totalCreditsEarned = 0;

    @Enumerated(EnumType.STRING)
    private Status status = Status.STUDYING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status {
        STUDYING, ACADEMIC_RESERVE, DROPPED_OUT, GRADUATED
    }

    public StudentProfile() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }

    public Curriculum getCurriculum() { return curriculum; }
    public void setCurriculum(Curriculum curriculum) { this.curriculum = curriculum; }

    public AdministrativeClass getAdministrativeClass() { return administrativeClass; }
    public void setAdministrativeClass(AdministrativeClass administrativeClass) { this.administrativeClass = administrativeClass; }

    public Integer getEnrollmentYear() { return enrollmentYear; }
    public void setEnrollmentYear(Integer enrollmentYear) { this.enrollmentYear = enrollmentYear; }

    public Integer getCurrentSemester() { return currentSemester; }
    public void setCurrentSemester(Integer currentSemester) { this.currentSemester = currentSemester; }

    public Double getCurrentGpa() { return currentGpa; }
    public void setCurrentGpa(Double currentGpa) { this.currentGpa = currentGpa; }

    public Double getCurrentGpa10() { return currentGpa10; }
    public void setCurrentGpa10(Double currentGpa10) { this.currentGpa10 = currentGpa10; }

    public Integer getTotalCreditsEarned() { return totalCreditsEarned; }
    public void setTotalCreditsEarned(Integer totalCreditsEarned) { this.totalCreditsEarned = totalCreditsEarned; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
