package com.example.demo.repository;

import com.example.demo.model.KnowledgeBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBlockRepository extends JpaRepository<KnowledgeBlock, Long> {
    List<KnowledgeBlock> findByCurriculumId(Long curriculumId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByCurriculumId(Long curriculumId);
}
