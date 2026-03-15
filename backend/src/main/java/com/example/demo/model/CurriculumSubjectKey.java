package com.example.demo.model;

import java.io.Serializable;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Embeddable;

@Embeddable
public class CurriculumSubjectKey implements Serializable {
    @Column(name = "curriculum_id")
    private Long curriculumId;

    @Column(name = "subject_id")
    private Long subjectId;

    public CurriculumSubjectKey() {}

    public CurriculumSubjectKey(Long curriculumId, Long subjectId) {
        this.curriculumId = curriculumId;
        this.subjectId = subjectId;
    }

    public Long getCurriculumId() { return curriculumId; }
    public void setCurriculumId(Long curriculumId) { this.curriculumId = curriculumId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CurriculumSubjectKey that = (CurriculumSubjectKey) o;
        return Objects.equals(curriculumId, that.curriculumId) &&
               Objects.equals(subjectId, that.subjectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(curriculumId, subjectId);
    }
}
