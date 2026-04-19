package com.courtly.repository;

import com.courtly.entity.Level;
import com.courtly.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, String> {

    List<Match> findByCourtId(String courtId);
    List<Match> findByLevel(Level level);
    List<Match> findByDate(LocalDate date);
    List<Match> findByCourtIdAndLevel(String courtId, Level level);
    List<Match> findByOrganizerId(String organizerId);
    List<Match> findByDateGreaterThanEqual(LocalDate date);
}
