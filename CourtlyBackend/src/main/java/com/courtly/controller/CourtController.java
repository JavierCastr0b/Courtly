package com.courtly.controller;

import com.courtly.entity.Court;
import com.courtly.entity.Match;
import com.courtly.repository.CourtRepository;
import com.courtly.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courts")
@RequiredArgsConstructor
public class CourtController {

    private final CourtRepository courtRepository;
    private final MatchRepository matchRepository;

    @GetMapping
    public List<Court> getAll() {
        return courtRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Court> getById(@PathVariable String id) {
        return courtRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/matches")
    public List<Match> getMatchesByCourt(@PathVariable String id) {
        return matchRepository.findByCourtId(id);
    }

    @GetMapping("/search")
    public List<Court> search(@RequestParam String q) {
        return courtRepository.searchByNameOrAddress(q);
    }
}
