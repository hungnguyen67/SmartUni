package com.example.demo.repository;

import com.example.demo.model.CurriculumSubject;
import com.example.demo.model.CurriculumSubjectKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CurriculumSubjectRepository extends JpaRepository<CurriculumSubject, CurriculumSubjectKey> {
    List<CurriculumSubject> findByCurriculumId(Long curriculumId);
    long countByCurriculumId(Long curriculumId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByCurriculumId(Long curriculumId);
}
