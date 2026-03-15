package com.example.demo.model;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class SubjectEquivalentKey implements Serializable {

    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "equivalent_subject_id")
    private Long equivalentSubjectId;

    public SubjectEquivalentKey() {}

    public SubjectEquivalentKey(Long subjectId, Long equivalentSubjectId) {
        this.subjectId = subjectId;
        this.equivalentSubjectId = equivalentSubjectId;
    }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Long getEquivalentSubjectId() { return equivalentSubjectId; }
    public void setEquivalentSubjectId(Long equivalentSubjectId) { this.equivalentSubjectId = equivalentSubjectId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SubjectEquivalentKey that = (SubjectEquivalentKey) o;
        return Objects.equals(subjectId, that.subjectId) &&
               Objects.equals(equivalentSubjectId, that.equivalentSubjectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(subjectId, equivalentSubjectId);
    }
}
