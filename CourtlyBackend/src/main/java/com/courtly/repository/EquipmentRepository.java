package com.courtly.repository;

import com.courtly.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, String> {
    List<Equipment> findByUserId(String userId);
}
