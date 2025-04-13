package org.personal.producer.controller;

import org.personal.producer.service.KafkaMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("producer")
public class ProdController {

    @Autowired
    private KafkaMessageService kafkaMessageService;

    @PostMapping("/test")
    ResponseEntity<String> test() {
        kafkaMessageService.sendMessage("HELLO WORLD");
        return ResponseEntity.ok("Hello World");
    }
}
