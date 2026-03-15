package com.example.demo.controller;

import com.example.demo.dto.AdministrativeClassDTO;
import com.example.demo.service.AdministrativeClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    @Autowired
    private AdministrativeClassService administrativeClassService;

    @GetMapping
    public List<AdministrativeClassDTO> getAllClasses() {
        return administrativeClassService.getAllClasses();
    }
}
