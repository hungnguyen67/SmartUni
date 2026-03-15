package com.example.demo.dto;

import java.time.LocalDateTime;

public class CurriculumDTO {
    private Long id;
    private String curriculumName;
    private String majorName;
    private String majorCode;
    private Long majorId;
    private Integer appliedYear;
    private Integer totalCreditsRequired;
    private Integer totalSubjects;
    private Integer totalKnowledgeBlocks;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CurriculumDTO() {}

    public CurriculumDTO(Long id, String curriculumName, String majorName, String majorCode, Long majorId, Integer appliedYear, Integer totalCreditsRequired, String status, Integer totalSubjects, Integer totalKnowledgeBlocks) {
        this.id = id;
        this.curriculumName = curriculumName;
        this.majorName = majorName;
        this.majorCode = majorCode;
        this.majorId = majorId;
        this.appliedYear = appliedYear;
        this.totalCreditsRequired = totalCreditsRequired;
        this.status = status;
        this.totalSubjects = totalSubjects;
        this.totalKnowledgeBlocks = totalKnowledgeBlocks;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCurriculumName() { return curriculumName; }
    public void setCurriculumName(String curriculumName) { this.curriculumName = curriculumName; }

    public String getMajorName() { return majorName; }
    public void setMajorName(String majorName) { this.majorName = majorName; }

    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }

    public Long getMajorId() { return majorId; }
    public void setMajorId(Long majorId) { this.majorId = majorId; }

    public Integer getAppliedYear() { return appliedYear; }
    public void setAppliedYear(Integer appliedYear) { this.appliedYear = appliedYear; }

    public Integer getTotalCreditsRequired() { return totalCreditsRequired; }
    public void setTotalCreditsRequired(Integer totalCreditsRequired) { this.totalCreditsRequired = totalCreditsRequired; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTotalSubjects() { return totalSubjects; }
    public void setTotalSubjects(Integer totalSubjects) { this.totalSubjects = totalSubjects; }

    public Integer getTotalKnowledgeBlocks() { return totalKnowledgeBlocks; }
    public void setTotalKnowledgeBlocks(Integer totalKnowledgeBlocks) { this.totalKnowledgeBlocks = totalKnowledgeBlocks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
