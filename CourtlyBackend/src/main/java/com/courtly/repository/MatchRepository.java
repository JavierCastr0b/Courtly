package com.courtly.repository;

import com.courtly.entity.Level;
import com.courtly.entity.Match;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, String> {

    List<Match> findByCourtId(String courtId);
    List<Match> findByLevel(Level level);
    List<Match> findByDate(LocalDate date);
    List<Match> findByCourtIdAndLevel(String courtId, Level level);
    List<Match> findByOrganizerId(String organizerId);
    List<Match> findByDateGreaterThanEqual(LocalDate date);
    List<Match> findByDateGreaterThanEqual(LocalDate date, Pageable pageable);

    @Query("SELECT m FROM Match m JOIN m.participants p WHERE p.id = :userId ORDER BY m.date DESC")
    List<Match> findByParticipantId(@Param("userId") String userId);

    @Query("SELECT m FROM Match m JOIN m.participants p WHERE p.id = :userId AND m.date = :date AND m.resultRecorded = false")
    List<Match> findActiveByParticipantAndDate(@Param("userId") String userId, @Param("date") LocalDate date);

    @Query("""
        SELECT m FROM Match m
        WHERE m.resultRecorded = false
        AND m.date >= :today
        AND m.organizer.id IN :friendIds
        ORDER BY m.date ASC
        """)
    List<Match> findActiveFriendMatches(@Param("friendIds") List<String> friendIds,
                                        @Param("today") java.time.LocalDate today);

    @Query("""
        SELECT DISTINCT m FROM Match m LEFT JOIN m.participants p
        WHERE m.resultRecorded = false
        AND m.date >= :today
        AND (m.organizer.id IN :followingIds OR p.id IN :followingIds)
        ORDER BY m.date ASC
        """)
    List<Match> findActiveFollowingMatches(@Param("followingIds") List<String> followingIds,
                                           @Param("today") java.time.LocalDate today);
}
