package com.courtly.repository;

import com.courtly.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface UserActivityRepository extends JpaRepository<UserActivity, String> {

    List<UserActivity> findByUserIdAndDateBetween(String userId, LocalDate from, LocalDate to);

    @Query("SELECT SUM(a.distanceKm) FROM UserActivity a WHERE a.user.id = :userId")
    Double sumDistanceByUserId(@Param("userId") String userId);

    @Query("SELECT SUM(a.durationMinutes) FROM UserActivity a WHERE a.user.id = :userId")
    Integer sumDurationByUserId(@Param("userId") String userId);
}
