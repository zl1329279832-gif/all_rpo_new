package com.chat.common.util;

import java.text.SimpleDateFormat;
import java.util.Date;

public class DateUtil {
    private static final SimpleDateFormat FORMATTER = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    private static final SimpleDateFormat TIME_FORMATTER = new SimpleDateFormat("HH:mm:ss");

    public static String format(Date dateTime) {
        if (dateTime == null) {
            return "";
        }
        return FORMATTER.format(dateTime);
    }

    public static String formatTime(Date dateTime) {
        if (dateTime == null) {
            return "";
        }
        return TIME_FORMATTER.format(dateTime);
    }
}
