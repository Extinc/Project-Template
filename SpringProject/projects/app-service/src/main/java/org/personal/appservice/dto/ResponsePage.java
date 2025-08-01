package org.personal.appservice.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;

/**
 * Response Page DTO
 * @param <T> generic type for different content
 */
public class ResponsePage<T> extends PageImpl<T> {

    /**
     * Constructor for ResponsePage
     * Required to handle deserialization
     *
     * @param content
     * @param number
     * @param size
     * @param totalElements
     * @param pageable
     * @param last
     * @param totalPages
     * @param sort
     * @param first
     * @param numberOfElements
     */
    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public ResponsePage(@JsonProperty("content") List<T> content, @JsonProperty("number") int number, @JsonProperty("size") int size,
                        @JsonProperty("totalElements") Long totalElements, @JsonProperty("pageable") JsonNode pageable, @JsonProperty("last") boolean last,
                        @JsonProperty("totalPages") int totalPages, @JsonProperty("sort") JsonNode sort, @JsonProperty("first") boolean first,
                        @JsonProperty("numberOfElements") int numberOfElements) {
        super(content, PageRequest.of(number, size), totalElements);
    }

    public ResponsePage(List<T> content, Pageable pageable, long total) {
        super(content, pageable, total);
    }

    public ResponsePage(List<T> content) {
        super(content);
    }

    public ResponsePage() {
        super(new ArrayList<T>());
    }
}
