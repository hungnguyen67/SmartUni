package com.example.demo.controller;

import com.example.demo.dto.MajorDTO;
import com.example.demo.service.MajorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/majors")
@CrossOrigin(origins = "http://localhost:4200")
public class MajorController {

    @Autowired
    private MajorService majorService;

    @GetMapping
    public List<MajorDTO> getAllMajors() {
        return majorService.getAllMajors();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MajorDTO> getMajorById(@PathVariable Long id) {
        return ResponseEntity.ok(majorService.getMajorById(id));
    }

    @PostMapping
    public ResponseEntity<MajorDTO> createMajor(@RequestBody MajorDTO majorDTO) {
        return ResponseEntity.ok(majorService.createMajor(majorDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MajorDTO> updateMajor(@PathVariable Long id, @RequestBody MajorDTO majorDTO) {
        return ResponseEntity.ok(majorService.updateMajor(id, majorDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMajor(@PathVariable Long id) {
        majorService.deleteMajor(id);
        return ResponseEntity.ok().build();
    }
}
