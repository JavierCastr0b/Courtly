package com.courtly.repository;

import com.courtly.entity.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, String> {

    @Query("SELECT c FROM Challenge c WHERE c.challenger.id = :userId OR c.challenged.id = :userId")
    List<Challenge> findByUserId(@Param("userId") String userId);
}
