package com.example.demo.repository;

import com.example.demo.model.ClassScheduleInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ClassScheduleInstanceRepository extends JpaRepository<ClassScheduleInstance, Long> {
    List<ClassScheduleInstance> findByCourseClassId(Long courseClassId);
    List<ClassScheduleInstance> findByScheduleDate(LocalDate date);
    List<ClassScheduleInstance> findByRoomNameAndScheduleDate(String roomName, LocalDate date);
    List<ClassScheduleInstance> findByLecturerUserIdAndScheduleDate(Long userId, LocalDate date);
}
