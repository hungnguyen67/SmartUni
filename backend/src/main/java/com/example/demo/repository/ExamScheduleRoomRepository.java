package com.example.demo.repository;

import com.example.demo.model.ExamScheduleRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamScheduleRoomRepository extends JpaRepository<ExamScheduleRoom, Long> {
    List<ExamScheduleRoom> findByExamScheduleId(Long examScheduleId);
}
