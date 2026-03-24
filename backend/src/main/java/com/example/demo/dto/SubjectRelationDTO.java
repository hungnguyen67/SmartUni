package com.example.demo.dto;

import java.time.LocalDate;

public class SubjectRelationDTO {
    private String relationType; // "PREREQUISITE", "COREQUISITE", "EQUIVALENT"
    private String subjectCode;
    private String subjectName;
    private String minGrade;
    private Boolean isParallel;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;

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

    public String getMinGrade() { return minGrade; }
    public void setMinGrade(String minGrade) { this.minGrade = minGrade; }

    public Boolean getIsParallel() { return isParallel; }
    public void setIsParallel(Boolean isParallel) { this.isParallel = isParallel; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
}
