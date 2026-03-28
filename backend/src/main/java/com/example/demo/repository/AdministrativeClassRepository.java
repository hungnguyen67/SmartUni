package com.example.demo.repository;

import com.example.demo.model.AdministrativeClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdministrativeClassRepository extends JpaRepository<AdministrativeClass, Long> {
    List<AdministrativeClass> findByAdvisorUserId(Long userId);
    Optional<AdministrativeClass> findByClassName(String className);
    Optional<AdministrativeClass> findByClassCode(String classCode);
}
