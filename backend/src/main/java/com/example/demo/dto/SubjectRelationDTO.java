package com.example.demo.dto;

public class SubjectRelationDTO {
    private String relationType; // "PREREQUISITE", "COREQUISITE", "EQUIVALENT"
    private String subjectCode;
    private String subjectName;

    public SubjectRelationDTO() {}

    public SubjectRelationDTO(String relationType, String subjectCode, String subjectName) {
        this.relationType = relationType;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
    }

    public String getRelationType() { return relationType; }
    public void setRelationType(String relationType) { this.relationType = relationType; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
}
