package org.personal.appservice.config.properties;

import org.personal.appservice.enumeration.Topic;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.ConstructorBinding;

import java.util.Map;

@ConfigurationProperties(prefix = "kafka")
public class KafkaProperties {

    private final Map<Topic, String> topic;

    @ConstructorBinding
    public KafkaProperties(Map<Topic, String> topic) {
        this.topic = topic;
    }

    public Map<Topic, String> getTopic() {
        return topic;
    }

}
