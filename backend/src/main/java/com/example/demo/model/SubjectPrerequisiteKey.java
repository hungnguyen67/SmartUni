package com.example.demo.model;

import java.io.Serializable;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Embeddable;

@Embeddable
public class SubjectPrerequisiteKey implements Serializable {
    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "prerequisite_subject_id")
    private Long prerequisiteSubjectId;

    public SubjectPrerequisiteKey() {}

    public SubjectPrerequisiteKey(Long subjectId, Long prerequisiteSubjectId) {
        this.subjectId = subjectId;
        this.prerequisiteSubjectId = prerequisiteSubjectId;
    }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Long getPrerequisiteSubjectId() { return prerequisiteSubjectId; }
    public void setPrerequisiteSubjectId(Long prerequisiteSubjectId) { this.prerequisiteSubjectId = prerequisiteSubjectId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SubjectPrerequisiteKey that = (SubjectPrerequisiteKey) o;
        return Objects.equals(subjectId, that.subjectId) &&
               Objects.equals(prerequisiteSubjectId, that.prerequisiteSubjectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(subjectId, prerequisiteSubjectId);
    }
}
