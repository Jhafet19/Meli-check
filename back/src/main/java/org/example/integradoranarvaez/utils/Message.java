package org.example.integradoranarvaez.utils;

public class Message {
    private String text;
    private Object result;
    private TypesResponse type;

    public Message(String text, TypesResponse type) {
        this.text = text;
        this.type = type;
    }

    public Message(String text, Object result, TypesResponse type) {
        this.text = text;
        this.result = result;
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }

    public TypesResponse getType() {
        return type;
    }

    public void setType(TypesResponse type) {
        this.type = type;
    }
}
