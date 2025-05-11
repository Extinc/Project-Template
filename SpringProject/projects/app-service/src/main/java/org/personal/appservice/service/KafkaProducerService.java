package org.personal.appservice.service;

import org.personal.appservice.dto.MessageDto;
import org.personal.appservice.enumeration.Operation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Service
public class KafkaProducerService {
    private final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendMessage(MessageDto messageDto, Operation type) {
        Message<MessageDto> msg = MessageBuilder
                .withPayload(messageDto)
                .setHeader(KafkaHeaders.KEY, "1")
                .setHeader(KafkaHeaders.TOPIC, "TEST")
                .setHeader("type", type.toString())
                .build();
        try{
            kafkaTemplate.send(msg);
        }catch (Exception e){
            logger.error("Error sending message to kafka", e);
        }
    }
}
