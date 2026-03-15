package com.example.demo.model;

import javax.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "knowledge_blocks", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"curriculum_id", "block_name"})
})
public class KnowledgeBlock implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id", nullable = false)
    private Curriculum curriculum;

    @Column(name = "block_name", nullable = false)
    private String blockName;

    @Column(name = "credits_required")
    private Integer creditsRequired = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type")
    private BlockType blockType = BlockType.MANDATORY;

    public enum BlockType {
        MANDATORY, ELECTIVE
    }

    public KnowledgeBlock() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Curriculum getCurriculum() { return curriculum; }
    public void setCurriculum(Curriculum curriculum) { this.curriculum = curriculum; }

    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }

    public Integer getCreditsRequired() { return creditsRequired; }
    public void setCreditsRequired(Integer creditsRequired) { this.creditsRequired = creditsRequired; }

    public BlockType getBlockType() { return blockType; }
    public void setBlockType(BlockType blockType) { this.blockType = blockType; }
}
