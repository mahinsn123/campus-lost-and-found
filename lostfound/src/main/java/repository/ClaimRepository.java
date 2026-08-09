package com.campus.lostfound.repository;

import com.campus.lostfound.model.ClaimRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<ClaimRequest, Long> {
    List<ClaimRequest> findByItemId(Long itemId);
}