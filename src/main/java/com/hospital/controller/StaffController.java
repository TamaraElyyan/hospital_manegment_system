package com.hospital.controller;

import com.hospital.model.Staff;
import com.hospital.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    @Autowired
    private StaffRepository staffRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Staff>> getAllStaff() {
        return ResponseEntity.ok(staffRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStaffById(@PathVariable Long id) {
        return staffRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/position/{position}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<List<Staff>> getStaffByPosition(@PathVariable String position) {
        return ResponseEntity.ok(staffRepository.findByPosition(position));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createStaff(@RequestBody Staff staff) {
        Staff savedStaff = staffRepository.save(staff);
        return ResponseEntity.ok(savedStaff);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStaff(@PathVariable Long id, @RequestBody Staff staffDetails) {
        return staffRepository.findById(id)
                .map(staff -> {
                    staff.setPosition(staffDetails.getPosition());
                    staff.setDepartment(staffDetails.getDepartment());
                    staff.setShift(staffDetails.getShift());
                    staff.setSchedule(staffDetails.getSchedule());
                    staff.setQualifications(staffDetails.getQualifications());
                    staff.setActive(staffDetails.getActive());
                    return ResponseEntity.ok(staffRepository.save(staff));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        return staffRepository.findById(id)
                .map(staff -> {
                    staffRepository.delete(staff);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
