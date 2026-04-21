package com.courtly.controller;

import com.courtly.dto.request.CreateMatchRequest;
import com.courtly.entity.Level;
import com.courtly.entity.Match;
import com.courtly.entity.User;
import com.courtly.repository.CourtRepository;
import com.courtly.repository.MatchRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchRepository matchRepository;
    private final CourtRepository courtRepository;

    @GetMapping
    public List<Match> getAll(@RequestParam(required = false) String courtId,
                              @RequestParam(required = false) Level level,
                              @RequestParam(required = false) LocalDate date) {
        if (courtId != null && level != null) return matchRepository.findByCourtIdAndLevel(courtId, level);
        if (courtId != null) return matchRepository.findByCourtId(courtId);
        if (level != null) return matchRepository.findByLevel(level);
        if (date != null) return matchRepository.findByDate(date);
        return matchRepository.findByDateGreaterThanEqual(LocalDate.now());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> getById(@PathVariable String id) {
        return matchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Match> create(@Valid @RequestBody CreateMatchRequest req,
                                        @AuthenticationPrincipal User user) {
        var court = req.getCourtId() != null
                ? courtRepository.findById(req.getCourtId()).orElse(null)
                : null;

        Match match = Match.builder()
                .court(court)
                .customLocation(req.getCustomLocation())
                .organizer(user)
                .date(req.getDate())
                .time(req.getTime())
                .level(req.getLevel())
                .totalSpots(req.getTotalSpots())
                .description(req.getDescription())
                .build();
        match.getParticipants().add(user);
        return ResponseEntity.ok(matchRepository.save(match));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Match> join(@PathVariable String id,
                                      @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (match.getSpotsLeft() <= 0)
            return ResponseEntity.badRequest().build();
        match.getParticipants().add(user);
        return ResponseEntity.ok(matchRepository.save(match));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable String id,
                                      @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        match.getParticipants().remove(user);
        matchRepository.save(match);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (!match.getOrganizer().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        matchRepository.delete(match);
        return ResponseEntity.noContent().build();
    }
}
