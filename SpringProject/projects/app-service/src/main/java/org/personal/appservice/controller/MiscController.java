package org.personal.appservice.controller;

import org.personal.appservice.dto.MessageDto;
import org.personal.appservice.enumeration.Operation;
import org.personal.appservice.service.KafkaProducerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/misc")
public class MiscController {
    private final Logger miscLogger = LoggerFactory.getLogger(MiscController.class);


    private final KafkaProducerService kafkaProducerService;

    @Autowired
    public MiscController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    @PostMapping("/kafka/{type}")
    @ResponseBody
    public String testKafka(@PathVariable("type") Operation type) {
        miscLogger.info("Received request for type {}", type);
        MessageDto msg = new MessageDto("Test");
        kafkaProducerService.sendMessage(msg, type);
        return "pong";
    }
}
