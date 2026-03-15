package com.example.demo.controller;

import com.example.demo.dto.LecturerDTO;
import com.example.demo.service.LecturerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturers")
public class LecturerController {

    @Autowired
    private LecturerService lecturerService;

    @GetMapping
    public List<LecturerDTO> getAllLecturers(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long majorId) {
        return lecturerService.getAllLecturers(searchTerm, majorId);
    }
}
