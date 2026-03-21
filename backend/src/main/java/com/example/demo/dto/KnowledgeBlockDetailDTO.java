package com.example.demo.dto;

import java.util.List;

public class KnowledgeBlockDetailDTO {
    private Long blockId;
    private String blockName;
    private String blockCode;
    private Integer creditsRequired;
    private String blockType;
    private List<CurriculumSubjectComponentDTO> subjects;

    public KnowledgeBlockDetailDTO() {}

    public KnowledgeBlockDetailDTO(Long blockId, String blockName, String blockCode, Integer creditsRequired, String blockType, List<CurriculumSubjectComponentDTO> subjects) {
        this.blockId = blockId;
        this.blockName = blockName;
        this.blockCode = blockCode;
        this.creditsRequired = creditsRequired;
        this.blockType = blockType;
        this.subjects = subjects;
    }

    public Long getBlockId() { return blockId; }
    public void setBlockId(Long blockId) { this.blockId = blockId; }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }

    public String getBlockCode() { return blockCode; }
    public void setBlockCode(String blockCode) { this.blockCode = blockCode; }

    public Integer getCreditsRequired() { return creditsRequired; }
    public void setCreditsRequired(Integer creditsRequired) { this.creditsRequired = creditsRequired; }

    public String getBlockType() { return blockType; }
    public void setBlockType(String blockType) { this.blockType = blockType; }

    public List<CurriculumSubjectComponentDTO> getSubjects() { return subjects; }
    public void setSubjects(List<CurriculumSubjectComponentDTO> subjects) { this.subjects = subjects; }
}
