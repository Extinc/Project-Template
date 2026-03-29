package org.personal.appservice.util;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.StackTraceElementProxy;
import org.jspecify.annotations.NonNull;
import org.slf4j.LoggerFactory;
import org.springframework.boot.json.JsonWriter;
import org.springframework.boot.logging.structured.StructuredLogFormatter;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.stream.Collectors;

@Configuration
public class JsonLayoutLogging implements StructuredLogFormatter<ILoggingEvent> {

    private final JsonWriter<ILoggingEvent> writer;
    private MaskingCustomizer maskingCustomizer;

    private String testScope;


    protected JsonLayoutLogging() {
        maskingCustomizer = new MaskingCustomizer();
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        this.testScope = resolveContext(context, "TEST_SCOPE", null);
        writer = buildWriter(maskingCustomizer);
    }

    private @NonNull JsonWriter<ILoggingEvent> buildWriter(MaskingCustomizer maskingCustomizer) {
        return JsonWriter.<ILoggingEvent>of(members -> {
            addMembers(members);
            maskingCustomizer.customize(members);
        }).withNewLineAtEnd();
    }

    @Override
    public @NonNull String format(ILoggingEvent event) {
        return this.writer.writeToString(event);
    }
    private String resolveContext(LoggerContext context, String key, String fallback) {
        String value = context.getProperty(key);
        return (value != null && !value.isBlank()) ? value : fallback;
    }
    private void addMembers(JsonWriter.Members<ILoggingEvent> members) {
        members.add("@timestamp", ILoggingEvent::getInstant);
        members.add("logger", ILoggingEvent::getLoggerName);
        members.add("level", ILoggingEvent::getLevel);
        members.add("thread", ILoggingEvent::getThreadName);
        members.add("test_scope", testScope);
        members.addMapEntries(ILoggingEvent::getMDCPropertyMap);
        members.add("exception", ILoggingEvent::getThrowableProxy)
                .whenNotNull()
                .usingMembers(this::addExceptionMembers);
    }


    private void addExceptionMembers(JsonWriter.Members<IThrowableProxy> members) {
        // className is usually never null, but guard anyway
        members.add("type", proxy ->
                proxy.getClassName() != null ? proxy.getClassName() : "UnknownException"
        );

        // message CAN be null (e.g. new NullPointerException() with no message)
        members.add("message", proxy ->
                proxy.getMessage() != null ? proxy.getMessage() : ""
        ).whenNotNull();

        // stackTrace array can be null or empty
        members.add("stackTrace", proxy -> {
            StackTraceElementProxy[] frames = proxy.getStackTraceElementProxyArray();
            if (frames == null || frames.length == 0) {
                return "";
            }
            return Arrays.stream(frames)
                    .filter(frame -> frame != null && frame.getSTEAsString() != null)
                    .map(StackTraceElementProxy::getSTEAsString)
                    .collect(Collectors.joining(", "));
        });

        // cause is null when there's no root cause — whenNotNull() skips it entirely
        members.add("cause", proxy ->
                proxy.getCause() != null ? formatCause(proxy.getCause()) : null
        ).whenNotNull();
    }

    // Formats cause as a flat string to avoid recursive usingMembers complexity
    private String formatCause(IThrowableProxy cause) {
        if (cause == null) return null;

        StringBuilder sb = new StringBuilder();
        sb.append(cause.getClassName() != null ? cause.getClassName() : "UnknownCause");

        if (cause.getMessage() != null) {
            sb.append(": ").append(cause.getMessage());
        }

        StackTraceElementProxy[] frames = cause.getStackTraceElementProxyArray();
        if (frames != null && frames.length > 0) {
            String trace = Arrays.stream(frames)
                    .filter(f -> f != null && f.getSTEAsString() != null)
                    .map(StackTraceElementProxy::getSTEAsString)
                    .collect(Collectors.joining(", "));
            if (!trace.isEmpty()) {
                sb.append(" | ").append(trace);
            }
        }

        // Recursively append further causes
        if (cause.getCause() != null) {
            sb.append(" | caused by: ").append(formatCause(cause.getCause()));
        }

        return sb.toString();
    }

    public void setTestScope(String testScope) {
        this.testScope = testScope;
    }
}

