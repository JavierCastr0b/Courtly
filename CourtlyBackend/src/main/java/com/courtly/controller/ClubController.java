package com.courtly.controller;

import com.courtly.entity.Club;
import com.courtly.entity.User;
import com.courtly.repository.ClubRepository;
import com.courtly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Club> getAll() {
        return clubRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Club> getById(@PathVariable String id) {
        return clubRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Club> create(@RequestBody Map<String, String> body,
                                       @AuthenticationPrincipal User user) {
        Club club = Club.builder()
                .name(body.get("name"))
                .description(body.get("description"))
                .location(body.get("location"))
                .build();
        club.getMembers().add(userRepository.findById(user.getId()).orElseThrow());
        return ResponseEntity.ok(clubRepository.save(club));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<Set<User>> getMembers(@PathVariable String id) {
        return clubRepository.findById(id)
                .map(c -> ResponseEntity.ok(c.getMembers()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> join(@PathVariable String id,
                                     @AuthenticationPrincipal User user) {
        Club club = clubRepository.findById(id).orElseThrow();
        club.getMembers().add(userRepository.findById(user.getId()).orElseThrow());
        clubRepository.save(club);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable String id,
                                      @AuthenticationPrincipal User user) {
        Club club = clubRepository.findById(id).orElseThrow();
        club.getMembers().remove(userRepository.findById(user.getId()).orElseThrow());
        clubRepository.save(club);
        return ResponseEntity.ok().build();
    }
}
