package com.example.demo.repository;

import com.example.demo.model.SubjectPrerequisite;
import com.example.demo.model.SubjectPrerequisiteKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectPrerequisiteRepository extends JpaRepository<SubjectPrerequisite, SubjectPrerequisiteKey> {
    List<SubjectPrerequisite> findBySubjectIdIn(List<Long> subjectIds);
}
