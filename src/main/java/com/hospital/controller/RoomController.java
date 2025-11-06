package com.hospital.controller;

import com.hospital.model.Room;
import com.hospital.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoomById(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<List<Room>> getRoomsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(roomRepository.findByStatus(status));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createRoom(@RequestBody Room room) {
        Room savedRoom = roomRepository.save(room);
        return ResponseEntity.ok(savedRoom);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<?> updateRoom(@PathVariable Long id, @RequestBody Room roomDetails) {
        return roomRepository.findById(id)
                .map(room -> {
                    room.setRoomNumber(roomDetails.getRoomNumber());
                    room.setRoomType(roomDetails.getRoomType());
                    room.setDepartment(roomDetails.getDepartment());
                    room.setFloor(roomDetails.getFloor());
                    room.setCapacity(roomDetails.getCapacity());
                    room.setStatus(roomDetails.getStatus());
                    room.setChargesPerDay(roomDetails.getChargesPerDay());
                    room.setCurrentPatient(roomDetails.getCurrentPatient());
                    room.setFacilities(roomDetails.getFacilities());
                    return ResponseEntity.ok(roomRepository.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(room -> {
                    roomRepository.delete(room);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
