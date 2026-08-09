package com.campus.lostfound.controller;

import com.campus.lostfound.model.ClaimRequest;
import com.campus.lostfound.repository.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    @Autowired
    private ClaimRepository claimRepository;

    @GetMapping
    public List<ClaimRequest> getAllClaims() {
        return claimRepository.findAll();
    }

    @GetMapping("/item/{itemId}")
    public List<ClaimRequest> getClaimsByItem(@PathVariable Long itemId) {
        return claimRepository.findByItemId(itemId);
    }

    @PostMapping
    public ResponseEntity<ClaimRequest> createClaim(@RequestBody ClaimRequest claimRequest) {
        try {
            if (claimRequest.getStatus() == null) {
                claimRequest.setStatus("PENDING");
            }
            ClaimRequest saved = claimRepository.save(claimRequest);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<ClaimRequest> verifyClaim(@PathVariable Long id) {
        try {
            ClaimRequest claim = claimRepository.findById(id).orElseThrow();
            claim.setStatus("VERIFIED");

            // ৪ ডিজিটের পাসকোড তৈরি
            String passcode = String.format("%04d", new Random().nextInt(10000));
            claim.setVerificationCode(passcode);

            ClaimRequest updated = claimRepository.save(claim);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}