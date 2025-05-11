package org.personal.consumer.controller;

import org.personal.consumer.enums.MessageType;
import org.personal.consumer.service.KafkaProducerService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("misc")
public class MiscController {

    private final KafkaProducerService kafkaProducerService;

    public MiscController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    @PostMapping("/kafka/{type}")
    public String testKafka(@PathVariable MessageType type) {
        kafkaProducerService.sendMessage("TEST", type);
        return "pong";
    }
}
