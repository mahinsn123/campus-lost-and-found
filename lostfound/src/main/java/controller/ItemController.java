package com.campus.lostfound.controller;

import com.campus.lostfound.model.Item;
import com.campus.lostfound.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "http://localhost:5173")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    @GetMapping
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @PostMapping
    public Item createItem(@RequestBody Item item) {
        if(item.getStatus() == null) item.setStatus("ACTIVE");
        return itemRepository.save(item);
    }

    @PutMapping("/{id}/resolve")
    public Item markAsResolved(@PathVariable Long id) {
        Item item = itemRepository.findById(id).orElseThrow();
        item.setStatus("RESOLVED");
        return itemRepository.save(item);
    }
}