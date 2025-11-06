package com.hospital.repository;

import com.hospital.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    List<Room> findByStatus(String status);
    List<Room> findByRoomType(String roomType);
    List<Room> findByDepartmentId(Long departmentId);
}
