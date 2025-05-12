package org.personal.appservice.enumeration;

public enum Topic {
    AUTH("Authentication");

    private final String label;

    Topic(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

}
