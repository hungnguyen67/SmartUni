package com.example.demo.model;

import javax.persistence.*;

@Entity
@Table(name = "subject_equivalents")
public class SubjectEquivalent {

    @EmbeddedId
    private SubjectEquivalentKey id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("subjectId")
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("equivalentSubjectId")
    @JoinColumn(name = "equivalent_subject_id")
    private Subject equivalentSubject;

    @Column(name = "min_grade_required")
    private String minGradeRequired;

    @Column(name = "effective_from")
    private java.time.LocalDate effectiveFrom;

    public SubjectEquivalent() {}

    public SubjectEquivalentKey getId() { return id; }
    public void setId(SubjectEquivalentKey id) { this.id = id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Subject getEquivalentSubject() { return equivalentSubject; }
    public void setEquivalentSubject(Subject equivalentSubject) { this.equivalentSubject = equivalentSubject; }

    public String getMinGradeRequired() { return minGradeRequired; }
    public void setMinGradeRequired(String minGradeRequired) { this.minGradeRequired = minGradeRequired; }

    public java.time.LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(java.time.LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
}
