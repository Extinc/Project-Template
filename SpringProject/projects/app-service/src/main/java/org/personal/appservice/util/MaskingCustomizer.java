package org.personal.appservice.util;

import ch.qos.logback.classic.spi.ILoggingEvent;
import org.springframework.boot.json.JsonWriter;
import org.springframework.boot.logging.structured.StructuredLoggingJsonMembersCustomizer;

import java.util.List;
import java.util.regex.Pattern;

public class MaskingCustomizer implements StructuredLoggingJsonMembersCustomizer<ILoggingEvent> {
    @Override
    public void customize(JsonWriter.Members<ILoggingEvent> members) {
        members.add("message", event -> maskInformation(event.getFormattedMessage()));
    }

    public MaskingCustomizer() {
    }

    record MaskRule(Pattern pattern, String replacement) {}

    private static final List<MaskRule> RULES = List.of(
            // Private keys
            new MaskRule(
                    Pattern.compile("-----BEGIN [A-Z ]*PRIVATE KEY-----"),
                    "[PRIVATE-KEY-REDACTED]")
    );

    public String maskInformation(String msg) {
        if (msg == null || msg.isBlank()) return "";
        for (MaskRule rule : RULES) {
            msg = rule.pattern().matcher(msg)
                    .replaceAll(rule.replacement());
        }
        return msg;
    }
}
