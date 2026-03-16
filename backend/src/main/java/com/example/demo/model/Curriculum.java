package com.example.demo.model;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "curriculums")
public class Curriculum implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id", nullable = false)
    private Major major;

    @Column(name = "curriculum_name", nullable = false)
    private String curriculumName;

    @Column(name = "applied_year", nullable = false)
    private Integer appliedYear;

    @Column(name = "total_credits_required")
    private Integer totalCreditsRequired = 120;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status {
        ACTIVE, INACTIVE, DRAFT
    }

    public Curriculum() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Major getMajor() { return major; }
    public void setMajor(Major major) { this.major = major; }

    public String getCurriculumName() { return curriculumName; }
    public void setCurriculumName(String curriculumName) { this.curriculumName = curriculumName; }

    public Integer getAppliedYear() { return appliedYear; }
    public void setAppliedYear(Integer appliedYear) { this.appliedYear = appliedYear; }

    public Integer getTotalCreditsRequired() { return totalCreditsRequired; }
    public void setTotalCreditsRequired(Integer totalCreditsRequired) { this.totalCreditsRequired = totalCreditsRequired; }

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
