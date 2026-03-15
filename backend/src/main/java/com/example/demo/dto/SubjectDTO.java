package com.example.demo.dto;

import java.time.LocalDateTime;

public class SubjectDTO {
    private Long id;
    private String subjectCode;
    private String name;
    private Integer credits;
    private Integer theoryCredits;
    private Integer practicalCredits;
    private Integer theoryPeriods;
    private Integer practicalPeriods;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SubjectDTO() {}

    public SubjectDTO(Long id, String subjectCode, String name, Integer credits, String description) {
        this.id = id;
        this.subjectCode = subjectCode;
        this.name = name;
        this.credits = credits;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public Integer getTheoryCredits() { return theoryCredits; }
    public void setTheoryCredits(Integer theoryCredits) { this.theoryCredits = theoryCredits; }

    public Integer getPracticalCredits() { return practicalCredits; }
    public void setPracticalCredits(Integer practicalCredits) { this.practicalCredits = practicalCredits; }

    public Integer getTheoryPeriods() { return theoryPeriods; }
    public void setTheoryPeriods(Integer theoryPeriods) { this.theoryPeriods = theoryPeriods; }

    public Integer getPracticalPeriods() { return practicalPeriods; }
    public void setPracticalPeriods(Integer practicalPeriods) { this.practicalPeriods = practicalPeriods; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
