package com.hospital.repository;

import com.hospital.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByPosition(String position);
    List<Staff> findByDepartmentId(Long departmentId);
    Optional<Staff> findByUserId(Long userId);
    List<Staff> findByActive(Boolean active);
}
