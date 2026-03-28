package com.example.demo.service;

import com.example.demo.dto.ExamScheduleCreateDTO;
import com.example.demo.dto.ExamScheduleDTO;
import com.example.demo.dto.StudentExamDTO;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.persistence.PersistenceContext;
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

    @Autowired
    private LecturerProfileRepository lecturerRepository;

    @Autowired
    private UserRepository userRepository;

    @PersistenceContext
    private javax.persistence.EntityManager entityManager;

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

        if (dto.getProctorId() != null) {
            lecturerRepository.findById(dto.getProctorId()).ifPresent(schedule::setProctor);
        }
        if (dto.getCreatedById() != null) {
            userRepository.findById(dto.getCreatedById()).ifPresent(schedule::setCreatedBy);
        }

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
        int proctorIdx = 0;
        for (java.util.Map.Entry<String, Integer> entry : aggregatedRooms.entrySet()) {
            ExamScheduleRoom esRoom = new ExamScheduleRoom();
            esRoom.setExamSchedule(schedule);
            esRoom.setRoomName(entry.getKey());
            esRoom.setRoomOrder(order++);
            esRoom.setSeatCapacityOverride(entry.getValue());
            
            if (dto.getProctorIds() != null && proctorIdx < dto.getProctorIds().size()) {
                lecturerRepository.findById(dto.getProctorIds().get(proctorIdx)).ifPresent(esRoom::setProctor);
                proctorIdx++;
            }
            
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

    public List<ExamScheduleDTO> getAllSchedules() {
        return examScheduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ExamScheduleDTO getScheduleDetails(Long id) {
        ExamSchedule schedule = examScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lịch thi không tồn tại"));
        
        ExamScheduleDTO dto = convertToDTO(schedule);
        
        // Load rooms for this schedule to lookup proctors
        List<ExamScheduleRoom> scheduleRooms = examScheduleRoomRepository.findByExamScheduleId(id);
        java.util.Map<String, String> proctorMap = scheduleRooms.stream()
                .filter(r -> r.getProctor() != null)
                .collect(Collectors.toMap(
                    ExamScheduleRoom::getRoomName,
                    r -> r.getProctor().getUser().getFullName(),
                    (existing, replacement) -> existing // handle duplicate room names if any
                ));

        List<ExamStudentAssignment> assignments = assignmentRepository.findByExamScheduleId(id);
        List<ExamScheduleDTO.StudentExamInfo> studentInfos = assignments.stream()
                .map(a -> {
                    ExamScheduleDTO.StudentExamInfo info = new ExamScheduleDTO.StudentExamInfo();
                    StudentProfile s = a.getStudent();
                    info.setId(s.getUserId());
                    info.setStudentCode(s.getStudentCode());
                    info.setFullName(s.getUser().getFullName());
                    if (s.getAdministrativeClass() != null) {
                        info.setClassName(s.getAdministrativeClass().getClassCode());
                    }
                    info.setRoomName(a.getRoomName());
                    if (a.getExamSlot() != null) {
                        info.setExamSlot(a.getExamSlot().getSlotNo());
                        info.setExamTime(a.getExamSlot().getStartTime());
                    }
                    info.setProctorName(proctorMap.getOrDefault(a.getRoomName(), "Chưa gán"));
                    return info;
                })
                .collect(Collectors.toList());
        
        dto.setAssignedStudents(studentInfos);
        return dto;
    }


    private ExamScheduleDTO convertToDTO(ExamSchedule entity) {
        ExamScheduleDTO dto = new ExamScheduleDTO();
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
                info.setSubjectId(entity.getCourseClass().getSubject().getId());
                info.setSubjectCode(entity.getCourseClass().getSubject().getSubjectCode());
                info.setSubjectName(entity.getCourseClass().getSubject().getName());
            }
            if (entity.getCourseClass().getSemester() != null) {
                info.setSemesterId(entity.getCourseClass().getSemester().getId());
                info.setSemesterName(entity.getCourseClass().getSemester().getName());
            }
            if (entity.getCourseClass().getTargetClass() != null) {
                info.setTargetClassId(entity.getCourseClass().getTargetClass().getId());
                info.setCohort(entity.getCourseClass().getTargetClass().getCohort());
            }
            dto.setCourseClass(info);
        }

        if (entity.getRooms() != null) {
            dto.setRooms(entity.getRooms().stream().map(r -> {
                com.example.demo.dto.ExamScheduleDTO.RoomInfo rm = new com.example.demo.dto.ExamScheduleDTO.RoomInfo();
                rm.setRoomName(r.getRoomName());
                rm.setCapacity(r.getSeatCapacityOverride());
                if (r.getProctor() != null) {
                    rm.setProctorId(r.getProctor().getUserId());
                }
                return rm;
            }).collect(Collectors.toList()));
            
            dto.setProctorIds(entity.getRooms().stream()
                .filter(r -> r.getProctor() != null)
                .map(r -> r.getProctor().getUserId())
                .collect(Collectors.toList()));
        }

        if (entity.getProctor() != null && entity.getProctor().getUser() != null) {
            User pUser = entity.getProctor().getUser();
            dto.setProctorId(entity.getProctor().getUserId());
            dto.setProctorName(pUser.getFullName() != null ? pUser.getFullName() : pUser.getEmail());
            dto.setProctorCode(entity.getProctor().getLecturerCode());
            dto.setProctorEmail(pUser.getEmail());
        } else if (entity.getCourseClass() != null && entity.getCourseClass().getLecturer() != null) {
            LecturerProfile lp = entity.getCourseClass().getLecturer();
            User lUser = lp.getUser();
            dto.setProctorName(lUser != null && lUser.getFullName() != null ? lUser.getFullName() : "Chưa phân công");
            dto.setProctorCode(lp.getLecturerCode());
        }

        if (entity.getCreatedBy() != null) {
            User cUser = entity.getCreatedBy();
            dto.setCreatedByName(cUser.getFullName() != null ? cUser.getFullName() : cUser.getEmail());
        }

        // Map slots
        List<ExamSlot> slots = examSlotRepository.findByExamScheduleId(entity.getId());
        if (slots != null) {
            dto.setSlots(slots.stream().map(s -> {
                com.example.demo.dto.ExamScheduleDTO.SlotInfo si = new com.example.demo.dto.ExamScheduleDTO.SlotInfo();
                si.setSlotNo(s.getSlotNo());
                si.setStartTime(s.getStartTime());
                si.setEndTime(s.getEndTime());
                return si;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    public List<String> getAssignedStudentCodes(Long subjectId, Long semesterId, String examType, Long excludeScheduleId) {
        if (excludeScheduleId != null) {
            return assignmentRepository.findAssignedStudentCodesExcludingSchedule(subjectId, semesterId, ExamSchedule.ExamType.valueOf(examType), excludeScheduleId);
        }
        return assignmentRepository.findAssignedStudentCodes(subjectId, semesterId, ExamSchedule.ExamType.valueOf(examType));
    }

    public List<String> getAllAssignedKeys(Long semesterId, String examType, Long excludeScheduleId) {
        if (excludeScheduleId != null) {
            return assignmentRepository.findAllAssignedStudentSubjectKeysExcludingSchedule(semesterId, ExamSchedule.ExamType.valueOf(examType), excludeScheduleId);
        }
        return assignmentRepository.findAllAssignedStudentSubjectKeys(semesterId, ExamSchedule.ExamType.valueOf(examType));
    }

    public List<ExamScheduleDTO> getLecturerExamSchedules(Long lecturerId) {
        java.util.Set<ExamSchedule> entitySet = new java.util.HashSet<>();
        entitySet.addAll(examScheduleRepository.findByProctorUserId(lecturerId));
        entitySet.addAll(examScheduleRepository.findByRoomsProctorUserId(lecturerId));
        
        return entitySet.stream()
                .map(s -> convertToLecturerDTO(s, lecturerId))
                .filter(dto -> (dto.getRooms() != null && !dto.getRooms().isEmpty()) || (dto.getProctorId() != null && dto.getProctorId().equals(lecturerId)))
                .collect(Collectors.toList());
    }

    private ExamScheduleDTO convertToLecturerDTO(ExamSchedule entity, Long lecturerId) {
        ExamScheduleDTO dto = convertToDTO(entity);
        
        if (dto.getRooms() != null) {
            List<ExamScheduleDTO.RoomInfo> myRooms = dto.getRooms().stream()
                .filter(r -> lecturerId.equals(r.getProctorId()))
                .collect(Collectors.toList());
            
            if (!myRooms.isEmpty()) {
                dto.setRooms(myRooms);
                User user = userRepository.findById(lecturerId).orElse(null);
                if (user != null) {
                    dto.setProctorName(user.getFullName());
                    dto.setProctorId(lecturerId);
                    lecturerRepository.findById(lecturerId).ifPresent(lp -> dto.setProctorCode(lp.getLecturerCode()));
                }
            }
        }
        return dto;
    }

    public List<StudentExamDTO> getStudentExamSchedules(Long studentId) {
        return assignmentRepository.findByStudentUserId(studentId).stream()
                .map(this::convertToStudentDTO)
                .collect(Collectors.toList());
    }

    private StudentExamDTO convertToStudentDTO(ExamStudentAssignment entity) {
        StudentExamDTO dto = new StudentExamDTO();
        ExamSchedule schedule = entity.getExamSchedule();
        ExamSlot slot = entity.getExamSlot();

        dto.setSubjectCode(schedule.getCourseClass().getSubject().getSubjectCode());
        dto.setSubjectName(schedule.getCourseClass().getSubject().getName());
        dto.setExamDate(schedule.getExamDate());
        dto.setStartTime(slot.getStartTime());
        dto.setEndTime(slot.getEndTime());
        dto.setExamFormat(schedule.getExamFormat());
        dto.setRoomName(entity.getRoomName());
        dto.setRollNumber(entity.getRollNumber());
        dto.setStudentName(entity.getStudent().getUser().getFullName());
        dto.setStudentCode(entity.getStudent().getStudentCode());
        if (schedule.getCourseClass() != null && schedule.getCourseClass().getSemester() != null) {
            dto.setSemesterId(schedule.getCourseClass().getSemester().getId());
        }
        
        return dto;
    }

    @Transactional
    public void deleteSchedule(Long id) {
        // Manual deletion to handle "Diamond" FK issues
        assignmentRepository.deleteByExamScheduleId(id);
        examSlotRepository.deleteByExamScheduleId(id);
        examScheduleRepository.deleteById(id);
    }

    @Transactional
    public ExamSchedule updateSchedule(@SuppressWarnings("null") Long id, ExamScheduleCreateDTO dto) {
        ExamSchedule schedule = examScheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lịch thi không tồn tại"));

        // Update core fields
        if (dto.getExamType() != null) schedule.setExamType(ExamSchedule.ExamType.valueOf(dto.getExamType()));
        if (dto.getExamFormat() != null) schedule.setExamFormat(dto.getExamFormat());
        if (dto.getExamDate() != null) {
            schedule.setExamDate(dto.getExamDate());
            // Also update slot dates
            if (schedule.getSlots() != null) {
                schedule.getSlots().forEach(s -> s.setSlotDate(dto.getExamDate()));
            }
        }
        if (dto.getDurationMinutes() != null) schedule.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getFirstSlotStart() != null) schedule.setFirstSlotStart(dto.getFirstSlotStart());
        if (dto.getGapDuration() != null) schedule.setGapDuration(dto.getGapDuration());

        if (dto.getProctorId() != null) {
            lecturerRepository.findById(dto.getProctorId()).ifPresent(schedule::setProctor);
        }

        // Update Rooms
        if (dto.getRooms() != null) {
            schedule.getRooms().clear();
            entityManager.flush(); // Force delete orphans before adding new ones to avoid UK violations
            
            int order = 1;
            int proctorIdx = 0;
            for (ExamScheduleCreateDTO.RoomCapacityDTO r : dto.getRooms()) {
                ExamScheduleRoom esRoom = new ExamScheduleRoom();
                esRoom.setExamSchedule(schedule);
                esRoom.setRoomName(r.getRoomName());
                esRoom.setRoomOrder(order++);
                esRoom.setSeatCapacityOverride(r.getCapacity());
                
                if (dto.getProctorIds() != null && proctorIdx < dto.getProctorIds().size()) {
                    lecturerRepository.findById(dto.getProctorIds().get(proctorIdx)).ifPresent(esRoom::setProctor);
                    proctorIdx++;
                }
                
                schedule.getRooms().add(esRoom);
            }
        }

        // Notes if any
        if (dto.getNotes() != null) schedule.setNotes(dto.getNotes());

        return examScheduleRepository.save(schedule);
    }
}
