package com.sokoban.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;

public class JsonUtil {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT)
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

    private JsonUtil() {
    }

    public static <T> T readFromFile(File file, Class<T> clazz) throws IOException {
        return OBJECT_MAPPER.readValue(file, clazz);
    }

    public static <T> T readFromFile(File file, TypeReference<T> typeReference) throws IOException {
        return OBJECT_MAPPER.readValue(file, typeReference);
    }

    public static <T> T readFromPath(Path path, Class<T> clazz) throws IOException {
        return readFromFile(path.toFile(), clazz);
    }

    public static <T> T readFromPath(Path path, TypeReference<T> typeReference) throws IOException {
        return readFromFile(path.toFile(), typeReference);
    }

    public static void writeToFile(File file, Object object) throws IOException {
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
        OBJECT_MAPPER.writeValue(file, object);
    }

    public static void writeToPath(Path path, Object object) throws IOException {
        writeToFile(path.toFile(), object);
    }

    public static String toJson(Object object) throws IOException {
        return OBJECT_MAPPER.writeValueAsString(object);
    }

    public static <T> T fromJson(String json, Class<T> clazz) throws IOException {
        return OBJECT_MAPPER.readValue(json, clazz);
    }

    public static <T> T fromJson(String json, TypeReference<T> typeReference) throws IOException {
        return OBJECT_MAPPER.readValue(json, typeReference);
    }
}
