package com.example.demo.dto;

public class CurriculumSubjectDetailDTO {
    private Long id; // subject_id or combined key string?
    private Long curriculumId;
    private String curriculumName;
    private Long blockId;
    private String blockName;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer recommendedSemester;
    private Integer credits;

    public CurriculumSubjectDetailDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCurriculumId() { return curriculumId; }
    public void setCurriculumId(Long curriculumId) { this.curriculumId = curriculumId; }

    public String getCurriculumName() { return curriculumName; }
    public void setCurriculumName(String curriculumName) { this.curriculumName = curriculumName; }

    public Long getBlockId() { return blockId; }
    public void setBlockId(Long blockId) { this.blockId = blockId; }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public Integer getRecommendedSemester() { return recommendedSemester; }
    public void setRecommendedSemester(Integer recommendedSemester) { this.recommendedSemester = recommendedSemester; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }
}
