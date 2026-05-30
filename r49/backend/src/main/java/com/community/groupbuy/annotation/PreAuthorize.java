package com.community.groupbuy.annotation;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PreAuthorize {

    String[] value() default {};

    Logical logical() default Logical.AND;

    enum Logical {
        AND,
        OR
    }
}
