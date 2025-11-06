package com.hospital.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String position;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    private String shift;

    private String schedule;

    private String qualifications;

    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime hiredDate;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
