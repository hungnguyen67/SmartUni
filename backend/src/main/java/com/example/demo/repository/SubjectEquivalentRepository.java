package com.example.demo.repository;

import com.example.demo.model.SubjectEquivalent;
import com.example.demo.model.SubjectEquivalentKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectEquivalentRepository extends JpaRepository<SubjectEquivalent, SubjectEquivalentKey> {
    List<SubjectEquivalent> findBySubjectIdIn(List<Long> subjectIds);
}
