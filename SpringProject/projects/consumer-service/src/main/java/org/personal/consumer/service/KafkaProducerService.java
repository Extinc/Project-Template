package org.personal.consumer.service;

import org.personal.consumer.enums.MessageType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(String message, MessageType type) {
        Message<String> msg = MessageBuilder
                .withPayload(message)
                .setHeader(KafkaHeaders.KEY, "1")
                .setHeader("type", type.toString())
                .build();
        kafkaTemplate.send("TEST", message);
    }
}
