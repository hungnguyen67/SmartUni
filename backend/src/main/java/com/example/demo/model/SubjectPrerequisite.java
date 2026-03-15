package com.example.demo.model;

import javax.persistence.*;

@Entity
@Table(name = "subject_prerequisites")
public class SubjectPrerequisite {

    @EmbeddedId
    private SubjectPrerequisiteKey id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("subjectId")
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("prerequisiteSubjectId")
    @JoinColumn(name = "prerequisite_subject_id")
    private Subject prerequisiteSubject;

    @Column(name = "min_grade_required")
    private String minGradeRequired = "D";

    @Column(name = "is_corequisite")
    private Boolean isCorequisite = false;

    @Column(name = "group_condition")
    private String groupCondition = "AND";

    public SubjectPrerequisite() {}
    public SubjectPrerequisiteKey getId() { return id; }
    public void setId(SubjectPrerequisiteKey id) { this.id = id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Subject getPrerequisiteSubject() { return prerequisiteSubject; }
    public void setPrerequisiteSubject(Subject prerequisiteSubject) { this.prerequisiteSubject = prerequisiteSubject; }

    public String getMinGradeRequired() { return minGradeRequired; }
    public void setMinGradeRequired(String minGradeRequired) { this.minGradeRequired = minGradeRequired; }

    public Boolean getIsCorequisite() { return isCorequisite; }
    public void setIsCorequisite(Boolean isCorequisite) { this.isCorequisite = isCorequisite; }

    public String getGroupCondition() { return groupCondition; }
    public void setGroupCondition(String groupCondition) { this.groupCondition = groupCondition; }
}
