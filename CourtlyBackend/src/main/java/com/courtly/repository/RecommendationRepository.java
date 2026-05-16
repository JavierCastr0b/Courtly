package com.courtly.repository;

import com.courtly.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RecommendationRepository extends JpaRepository<Recommendation, String> {

    Optional<Recommendation> findByFromUserIdAndToUserId(String fromUserId, String toUserId);

    @Query("SELECT AVG(r.stars) FROM Recommendation r WHERE r.toUser.id = :userId")
    Double computeAverageRating(@Param("userId") String userId);

    @Query("SELECT COUNT(r) FROM Recommendation r WHERE r.toUser.id = :userId")
    long countByToUserId(@Param("userId") String userId);
}
