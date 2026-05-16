package com.courtly.controller;

import com.courtly.entity.Equipment;
import com.courtly.entity.User;
import com.courtly.repository.EquipmentRepository;
import com.courtly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Equipment> add(@RequestBody Map<String, String> body,
                                         @AuthenticationPrincipal User current) {
        User user = userRepository.findById(current.getId()).orElseThrow();
        Equipment equipment = Equipment.builder()
                .user(user)
                .type(body.get("type"))
                .name(body.get("name"))
                .brand(body.get("brand"))
                .build();
        return ResponseEntity.ok(equipmentRepository.save(equipment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @AuthenticationPrincipal User current) {
        Equipment equipment = equipmentRepository.findById(id).orElseThrow();
        if (!equipment.getUser().getId().equals(current.getId()))
            return ResponseEntity.status(403).build();
        equipmentRepository.delete(equipment);
        return ResponseEntity.noContent().build();
    }
}
