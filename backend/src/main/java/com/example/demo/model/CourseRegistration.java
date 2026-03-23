package com.example.demo.model;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_registrations")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CourseRegistration implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_class_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"schedules", "hibernateLazyInitializer", "handler"})
    private CourseClass courseClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "user"})
    private StudentProfile student;

    @Column(name = "enrollment_date")
    private LocalDateTime enrollmentDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private RegistrationStatus status = RegistrationStatus.REGISTERED;

    @Column(name = "attendance_score")
    private Double attendanceScore;

    @Column(name = "midterm_score")
    private Double midtermScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "is_passed")
    private Boolean isPassed;

    @Column(name = "grade_letter")
    private String gradeLetter;

    @Column(name = "grade_point")
    private Double gradePoint;

    @PrePersist
    @PreUpdate
    public void calculateGrades() {
        this.updatedAt = java.time.LocalDateTime.now();
        
        // Only calculate if all scores are present
        if (attendanceScore == null || midtermScore == null || finalScore == null) {
            this.totalScore = null;
            this.gradeLetter = null;
            this.gradePoint = null;
            this.isPassed = null;
            return;
        }
        
        double attWeight = (courseClass != null) ? courseClass.getAttendanceWeight() : 0.1;
        double midWeight = (courseClass != null) ? courseClass.getMidtermWeight() : 0.3;
        double finWeight = (courseClass != null) ? courseClass.getFinalWeight() : 0.6;
        
        double total = (attendanceScore * attWeight) + (midtermScore * midWeight) + (finalScore * finWeight);
        this.totalScore = Math.round(total * 100.0) / 100.0;
        
        this.isPassed = this.totalScore >= 4.0;
        if (this.totalScore >= 8.5) { this.gradeLetter = "A"; this.gradePoint = 4.0; }
        else if (this.totalScore >= 7.0) { this.gradeLetter = "B"; this.gradePoint = 3.0; }
        else if (this.totalScore >= 5.5) { this.gradeLetter = "C"; this.gradePoint = 2.0; }
        else if (this.totalScore >= 4.0) { this.gradeLetter = "D"; this.gradePoint = 1.0; }
        else { this.gradeLetter = "F"; this.gradePoint = 0.0; }
    }

    @Column(name = "score_updated_at")
    private LocalDateTime scoreUpdatedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum RegistrationStatus {
        REGISTERED, STUDYING, DROPPED, COMPLETED
    }

    public CourseRegistration() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CourseClass getCourseClass() { return courseClass; }
    public void setCourseClass(CourseClass courseClass) { this.courseClass = courseClass; }

    public StudentProfile getStudent() { return student; }
    public void setStudent(StudentProfile student) { this.student = student; }

    public LocalDateTime getEnrollmentDate() { return enrollmentDate; }
    public void setEnrollmentDate(LocalDateTime enrollmentDate) { this.enrollmentDate = enrollmentDate; }

    public RegistrationStatus getStatus() { return status; }
    public void setStatus(RegistrationStatus status) { this.status = status; }

    public Double getAttendanceScore() { return attendanceScore; }
    public void setAttendanceScore(Double attendanceScore) { this.attendanceScore = attendanceScore; }

    public Double getMidtermScore() { return midtermScore; }
    public void setMidtermScore(Double midtermScore) { this.midtermScore = midtermScore; }

    public Double getFinalScore() { return finalScore; }
    public void setFinalScore(Double finalScore) { this.finalScore = finalScore; }

    public Double getTotalScore() { return totalScore; }
    public void setTotalScore(Double totalScore) { this.totalScore = totalScore; }

    public Boolean getIsPassed() { return isPassed; }
    public void setIsPassed(Boolean isPassed) { this.isPassed = isPassed; }

    public String getGradeLetter() { return gradeLetter; }
    public void setGradeLetter(String gradeLetter) { this.gradeLetter = gradeLetter; }

    public LocalDateTime getScoreUpdatedAt() { return scoreUpdatedAt; }
    public void setScoreUpdatedAt(LocalDateTime scoreUpdatedAt) { this.scoreUpdatedAt = scoreUpdatedAt; }

    public Double getGradePoint() { return gradePoint; }
    public void setGradePoint(Double gradePoint) { this.gradePoint = gradePoint; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
