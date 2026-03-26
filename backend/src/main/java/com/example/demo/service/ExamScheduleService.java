package com.example.demo.service;

import com.example.demo.dto.ExamScheduleCreateDTO;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamScheduleService {

    @Autowired
    private ExamScheduleRepository examScheduleRepository;

    @Autowired
    private ExamScheduleRoomRepository examScheduleRoomRepository;

    @Autowired
    private ExamSlotRepository examSlotRepository;

    @Autowired
    private ExamSlotRoomRepository examSlotRoomRepository;

    @Autowired
    private ExamStudentAssignmentRepository assignmentRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private CourseRegistrationRepository registrationRepository;

    @Transactional
    public ExamSchedule createExamSchedule(ExamScheduleCreateDTO dto) {
        Long primaryClassId = dto.getCourseClassId();
        if (primaryClassId == null && dto.getCourseClassIds() != null && !dto.getCourseClassIds().isEmpty()) {
            primaryClassId = dto.getCourseClassIds().get(0);
        }

        if (primaryClassId == null) {
            throw new RuntimeException("Vui lòng chọn Học phần và Khóa học.");
        }

        CourseClass courseClass = courseClassRepository.findById(primaryClassId)
                .orElseThrow(() -> new RuntimeException("Course Class not found"));

        ExamSchedule schedule = new ExamSchedule();
        schedule.setCourseClass(courseClass);
        schedule.setExamType(ExamSchedule.ExamType.valueOf(dto.getExamType()));
        schedule.setExamFormat(dto.getExamFormat());
        schedule.setExamDate(dto.getExamDate());
        schedule.setDurationMinutes(dto.getDurationMinutes());
        schedule.setFirstSlotStart(dto.getFirstSlotStart());
        schedule.setGapDuration(dto.getGapDuration());
        schedule.setArrangementMode(dto.getArrangementMode());
        schedule.setIsShuffled(dto.getIsShuffled());
        schedule.setHasRollNumbers(dto.getHasRollNumbers());
        schedule.setStatus("ARRANGED");

        schedule = examScheduleRepository.save(schedule);

        // Fetch unique students for ALL provided course class ids
        List<Long> targetIds = dto.getCourseClassIds();
        if (targetIds == null || targetIds.isEmpty()) {
            targetIds = Collections.singletonList(courseClass.getId());
        }

        java.util.Set<Long> processedStudentIds = new java.util.HashSet<>();
        List<StudentProfile> students = registrationRepository.findByCourseClassIdIn(targetIds)
                .stream()
                .map(CourseRegistration::getStudent)
                .filter(s -> s != null && processedStudentIds.add(s.getUserId()))
                .collect(Collectors.toList());

        if (dto.getIsShuffled() != null && dto.getIsShuffled()) {
            Collections.shuffle(students);
        } else if ("BY_NAME".equals(dto.getArrangementMode())) {
            students.sort(Comparator.comparing(s -> s.getUser().getFirstName()));
        } else if ("BY_STUDENT_CODE".equals(dto.getArrangementMode())) {
            students.sort(Comparator.comparing(StudentProfile::getStudentCode));
        }

        // Aggregate rooms to ensure unique room names and sum capacities
        java.util.Map<String, Integer> aggregatedRooms = new java.util.LinkedHashMap<>();
        for (ExamScheduleCreateDTO.RoomCapacityDTO r : dto.getRooms()) {
            aggregatedRooms.put(r.getRoomName(), aggregatedRooms.getOrDefault(r.getRoomName(), 0) + r.getCapacity());
        }

        // Save Exam Schedule Rooms (using aggregated data)
        int order = 1;
        for (java.util.Map.Entry<String, Integer> entry : aggregatedRooms.entrySet()) {
            ExamScheduleRoom esRoom = new ExamScheduleRoom();
            esRoom.setExamSchedule(schedule);
            esRoom.setRoomName(entry.getKey());
            esRoom.setRoomOrder(order++);
            esRoom.setSeatCapacityOverride(entry.getValue());
            examScheduleRoomRepository.save(esRoom);
        }

        int totalStudents = students.size();
        int capacityPerSlot = aggregatedRooms.values().stream().mapToInt(Integer::intValue).sum();

        if (capacityPerSlot == 0) {
            throw new RuntimeException("Tổng sức chứa phòng phải lớn hơn 0.");
        }

        int requiredSlots = (int) Math.ceil((double) totalStudents / capacityPerSlot);

        int studentIndex = 0;

        for (int i = 0; i < requiredSlots; i++) {
            ExamSlot slot = new ExamSlot();
            slot.setExamSchedule(schedule);
            slot.setSlotNo(i + 1);
            slot.setSlotDate(dto.getExamDate());
            
            LocalTime slotStart = dto.getFirstSlotStart().plusMinutes((long) i * (dto.getDurationMinutes() + dto.getGapDuration()));
            slot.setStartTime(slotStart);
            slot.setEndTime(slotStart.plusMinutes(dto.getDurationMinutes()));
            
            slot = examSlotRepository.save(slot);

            for (java.util.Map.Entry<String, Integer> entry : aggregatedRooms.entrySet()) {
                if (studentIndex >= totalStudents) break;

                String roomName = entry.getKey();
                int roomCapacity = entry.getValue();

                ExamSlotRoom slotRoom = new ExamSlotRoom();
                slotRoom.setExamSlot(slot);
                slotRoom.setRoomName(roomName);
                slotRoom.setSeatCapacity(roomCapacity);
                slotRoom = examSlotRoomRepository.save(slotRoom);

                for (int seat = 1; seat <= roomCapacity; seat++) {
                    if (studentIndex >= totalStudents) break;

                    StudentProfile student = students.get(studentIndex);
                    ExamStudentAssignment assignment = new ExamStudentAssignment();
                    assignment.setExamSchedule(schedule);
                    assignment.setExamSlot(slot);
                    assignment.setRoomName(roomName);
                    assignment.setStudent(student);
                    assignment.setSeatNumber(String.format("%02d", seat));
                    
                    if (dto.getHasRollNumbers() != null && dto.getHasRollNumbers()) {
                        String rollNo = String.format("%s%03d", dto.getExamType().substring(0, 1), studentIndex + 1);
                        assignment.setRollNumber(rollNo);
                    }
                    
                    assignmentRepository.save(assignment);
                    studentIndex++;
                }
            }
        }
        
        return schedule;
    }

    public List<com.example.demo.dto.ExamScheduleDTO> getAllSchedules() {
        return examScheduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private com.example.demo.dto.ExamScheduleDTO convertToDTO(ExamSchedule entity) {
        com.example.demo.dto.ExamScheduleDTO dto = new com.example.demo.dto.ExamScheduleDTO();
        dto.setId(entity.getId());
        dto.setExamType(entity.getExamType().toString());
        dto.setExamFormat(entity.getExamFormat());
        dto.setExamDate(entity.getExamDate());
        dto.setDurationMinutes(entity.getDurationMinutes());
        dto.setFirstSlotStart(entity.getFirstSlotStart());
        dto.setStatus(entity.getStatus());
        dto.setTotalStudents((int) assignmentRepository.countByExamScheduleId(entity.getId()));

        if (entity.getCourseClass() != null) {
            com.example.demo.dto.ExamScheduleDTO.CourseClassInfo info = new com.example.demo.dto.ExamScheduleDTO.CourseClassInfo();
            info.setId(entity.getCourseClass().getId());
            info.setClassCode(entity.getCourseClass().getClassCode());
            info.setClassName(entity.getCourseClass().getClassName());
            info.setCurrentEnrolled(entity.getCourseClass().getCurrentEnrolled());
            if (entity.getCourseClass().getSubject() != null) {
                info.setSubjectName(entity.getCourseClass().getSubject().getName());
            }
            if (entity.getCourseClass().getSemester() != null) {
                info.setSemesterId(entity.getCourseClass().getSemester().getId());
                info.setSemesterName(entity.getCourseClass().getSemester().getName());
            }
            dto.setCourseClass(info);
        }

        if (entity.getRooms() != null) {
            dto.setRooms(entity.getRooms().stream().map(r -> {
                com.example.demo.dto.ExamScheduleDTO.RoomInfo rm = new com.example.demo.dto.ExamScheduleDTO.RoomInfo();
                rm.setRoomName(r.getRoomName());
                rm.setCapacity(r.getSeatCapacityOverride());
                return rm;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    public List<String> getAssignedStudentCodes(Long subjectId, Long semesterId, String examType) {
        return assignmentRepository.findAssignedStudentCodes(subjectId, semesterId, ExamSchedule.ExamType.valueOf(examType));
    }

    public List<String> getAllAssignedKeys(Long semesterId, String examType) {
        return assignmentRepository.findAllAssignedStudentSubjectKeys(semesterId, ExamSchedule.ExamType.valueOf(examType));
    }
}
