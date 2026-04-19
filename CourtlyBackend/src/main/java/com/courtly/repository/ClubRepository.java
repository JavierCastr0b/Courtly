package com.courtly.repository;

import com.courtly.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClubRepository extends JpaRepository<Club, String> {

    @Query("SELECT c FROM Club c JOIN c.members m WHERE m.id = :userId")
    List<Club> findByMemberId(@Param("userId") String userId);
}
