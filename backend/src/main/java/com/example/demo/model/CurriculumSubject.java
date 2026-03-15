package com.example.demo.model;

import javax.persistence.*;

@Entity
@Table(name = "curriculum_subjects")
public class CurriculumSubject {

    @EmbeddedId
    private CurriculumSubjectKey id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("curriculumId")
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("subjectId")
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "block_id", nullable = false)
    private KnowledgeBlock knowledgeBlock;

    @Column(name = "recommended_semester")
    private Integer recommendedSemester;

    @Column(name = "is_required")
    private Boolean isRequired = true;

    public CurriculumSubject() {}

    public CurriculumSubjectKey getId() { return id; }
    public void setId(CurriculumSubjectKey id) { this.id = id; }

    public Curriculum getCurriculum() { return curriculum; }
    public void setCurriculum(Curriculum curriculum) { this.curriculum = curriculum; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public KnowledgeBlock getKnowledgeBlock() { return knowledgeBlock; }
    public void setKnowledgeBlock(KnowledgeBlock knowledgeBlock) { this.knowledgeBlock = knowledgeBlock; }

    public Integer getRecommendedSemester() { return recommendedSemester; }
    public void setRecommendedSemester(Integer recommendedSemester) { this.recommendedSemester = recommendedSemester; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }
}
