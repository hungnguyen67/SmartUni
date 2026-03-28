package com.example.demo.repository;

import com.example.demo.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
    List<Curriculum> findByMajorId(Long majorId);
    Optional<Curriculum> findByCurriculumName(String curriculumName);
}
