package org.personal.producer.service;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.personal.producer.enumeration.KafkaAction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class KafkaMessageService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    public void sendMessage(String msg) {

        // Option 1 : Using ProducerRecord
        ProducerRecord<String, String> record = new ProducerRecord<>(
                "test-topic", null, null, "he", msg
        );
        byte[] action = KafkaAction.CREATE.toString().getBytes(StandardCharsets.UTF_8);
        record.headers().add("action", action);

        // Option 2 : Using Message
        Message<String> msgObj = MessageBuilder.withPayload(msg)
                .setHeader("action", KafkaAction.CREATE)
                .setHeader(KafkaHeaders.KEY, "key123")
                .setHeader(KafkaHeaders.TOPIC, "test-topic")

                .build();
        kafkaTemplate.send(msgObj);
    }
}
