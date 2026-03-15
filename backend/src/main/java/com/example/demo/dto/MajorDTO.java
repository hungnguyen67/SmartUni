package com.example.demo.dto;

import java.time.LocalDateTime;

public class MajorDTO {
    private Long id;
    private String majorCode;
    private String majorName;
    private Long facultyId;
    private String facultyName;
    private String facultyCode;
    private String description;
    private int numberOfCurriculums;
    private int totalCreditsRequired;
    private String activeCurriculumName;
    private int totalSubjects;
    private int totalKnowledgeBlocks;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MajorDTO() {}

    public MajorDTO(Long id, String majorCode, String majorName, Long facultyId, String facultyName, String facultyCode, String description, int numberOfCurriculums, int totalCreditsRequired, String status, String activeCurriculumName, int totalSubjects, int totalKnowledgeBlocks) {
        this.id = id;
        this.majorCode = majorCode;
        this.majorName = majorName;
        this.facultyId = facultyId;
        this.facultyName = facultyName;
        this.facultyCode = facultyCode;
        this.description = description;
        this.numberOfCurriculums = numberOfCurriculums;
        this.totalCreditsRequired = totalCreditsRequired;
        this.status = status;
        this.activeCurriculumName = activeCurriculumName;
        this.totalSubjects = totalSubjects;
        this.totalKnowledgeBlocks = totalKnowledgeBlocks;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMajorCode() { return majorCode; }
    public void setMajorCode(String majorCode) { this.majorCode = majorCode; }

    public String getMajorName() { return majorName; }
    public void setMajorName(String majorName) { this.majorName = majorName; }

    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getFacultyCode() { return facultyCode; }
    public void setFacultyCode(String facultyCode) { this.facultyCode = facultyCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getNumberOfCurriculums() { return numberOfCurriculums; }
    public void setNumberOfCurriculums(int numberOfCurriculums) { this.numberOfCurriculums = numberOfCurriculums; }

    public int getTotalCreditsRequired() { return totalCreditsRequired; }
    public void setTotalCreditsRequired(int totalCreditsRequired) { this.totalCreditsRequired = totalCreditsRequired; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getActiveCurriculumName() { return activeCurriculumName; }
    public void setActiveCurriculumName(String activeCurriculumName) { this.activeCurriculumName = activeCurriculumName; }

    public int getTotalSubjects() { return totalSubjects; }
    public void setTotalSubjects(int totalSubjects) { this.totalSubjects = totalSubjects; }

    public int getTotalKnowledgeBlocks() { return totalKnowledgeBlocks; }
    public void setTotalKnowledgeBlocks(int totalKnowledgeBlocks) { this.totalKnowledgeBlocks = totalKnowledgeBlocks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
