package com.example.demo.repository;

import com.example.demo.model.ExamSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamSlotRepository extends JpaRepository<ExamSlot, Long> {
    List<ExamSlot> findByExamScheduleId(Long scheduleId);
}
