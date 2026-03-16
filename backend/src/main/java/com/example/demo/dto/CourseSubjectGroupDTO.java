package com.example.demo.dto;

public class CourseSubjectGroupDTO {
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Integer classCount;
    private String status;
    private boolean required = true;

    public CourseSubjectGroupDTO() {}
    public CourseSubjectGroupDTO(Long subjectId, String subjectCode, String subjectName, Integer credits, Integer classCount, String status, boolean required) {
        this.subjectId = subjectId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.credits = credits;
        this.classCount = classCount;
        this.status = status;
        this.required = required;
    }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
    public Integer getClassCount() { return classCount; }
    public void setClassCount(Integer classCount) { this.classCount = classCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
}
