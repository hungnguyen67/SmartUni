package com.example.demo.dto;

import java.util.List;

public class CurriculumSubjectComponentDTO {
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Integer semester;
    private List<String> prerequisites;
    private List<String> corequisites;
    private List<String> equivalents;
    private Integer theoryPeriods;
    private Integer practicalPeriods;
    
    public CurriculumSubjectComponentDTO() {}

    public CurriculumSubjectComponentDTO(Long subjectId, String subjectCode, String subjectName, Integer credits, Integer semester, List<String> prerequisites, List<String> corequisites, List<String> equivalents, Integer theoryPeriods, Integer practicalPeriods) {
        this.subjectId = subjectId;
        this.subjectCode = subjectCode;
        this.subjectName = subjectName;
        this.credits = credits;
        this.semester = semester;
        this.prerequisites = prerequisites;
        this.corequisites = corequisites;
        this.equivalents = equivalents;
        this.theoryPeriods = theoryPeriods;
        this.practicalPeriods = practicalPeriods;
    }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public List<String> getPrerequisites() { return prerequisites; }
    public void setPrerequisites(List<String> prerequisites) { this.prerequisites = prerequisites; }

    public List<String> getCorequisites() { return corequisites; }
    public void setCorequisites(List<String> corequisites) { this.corequisites = corequisites; }

    public List<String> getEquivalents() { return equivalents; }
    public void setEquivalents(List<String> equivalents) { this.equivalents = equivalents; }

    public Integer getTheoryPeriods() { return theoryPeriods; }
    public void setTheoryPeriods(Integer theoryPeriods) { this.theoryPeriods = theoryPeriods; }

    public Integer getPracticalPeriods() { return practicalPeriods; }
    public void setPracticalPeriods(Integer practicalPeriods) { this.practicalPeriods = practicalPeriods; }
}
