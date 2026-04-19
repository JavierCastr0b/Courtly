package com.courtly.repository;

import com.courtly.entity.Court;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourtRepository extends JpaRepository<Court, String> {

    @Query("SELECT c FROM Court c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.address) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Court> searchByNameOrAddress(@Param("q") String q);
}
