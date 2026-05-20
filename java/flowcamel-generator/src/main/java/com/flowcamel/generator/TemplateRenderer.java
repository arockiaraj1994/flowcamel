package com.flowcamel.generator;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TemplateRenderer {
  private static final Pattern EACH =
      Pattern.compile("\\{\\{#each (\\w+)\\}\\}([\\s\\S]*?)\\{\\{/each\\}\\}", Pattern.MULTILINE);
  private static final Pattern IF =
      Pattern.compile("\\{\\{#if (\\w+)\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}", Pattern.MULTILINE);
  private static final Pattern VAR = Pattern.compile("\\{\\{([^#/][^}]*)\\}\\}");

  private TemplateRenderer() {}

  public static String render(String name, Map<String, Object> ctx) throws IOException {
    String template = load(name);
    return apply(template, ctx);
  }

  private static String load(String name) throws IOException {
    String path = "templates/" + name;
    try (InputStream in = TemplateRenderer.class.getClassLoader().getResourceAsStream(path)) {
      if (in == null) throw new IOException("Missing template: " + path);
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  @SuppressWarnings("unchecked")
  private static String apply(String template, Map<String, Object> ctx) {
    String result = template;
    Matcher eachMatcher = EACH.matcher(result);
    StringBuffer sb = new StringBuffer();
    while (eachMatcher.find()) {
      String key = eachMatcher.group(1);
      String body = eachMatcher.group(2);
      Object val = ctx.get(key);
      StringBuilder replacement = new StringBuilder();
      if (val instanceof List<?> list) {
        for (Object item : list) {
          if (item instanceof String s) {
            replacement.append(body.replace("{{this}}", s));
          }
        }
      }
      eachMatcher.appendReplacement(sb, Matcher.quoteReplacement(replacement.toString()));
    }
    eachMatcher.appendTail(sb);
    result = sb.toString();

    Matcher ifMatcher = IF.matcher(result);
    sb = new StringBuffer();
    while (ifMatcher.find()) {
      String key = ifMatcher.group(1);
      String body = ifMatcher.group(2);
      Object val = ctx.get(key);
      boolean show =
          switch (val) {
            case null -> false;
            case Boolean b -> b;
            case String s -> !s.isEmpty();
            default -> true;
          };
      ifMatcher.appendReplacement(sb, Matcher.quoteReplacement(show ? body : ""));
    }
    ifMatcher.appendTail(sb);
    result = sb.toString();

    Matcher varMatcher = VAR.matcher(result);
    sb = new StringBuffer();
    while (varMatcher.find()) {
      String key = varMatcher.group(1).trim();
      Object val = ctx.get(key);
      varMatcher.appendReplacement(sb, Matcher.quoteReplacement(val == null ? "" : String.valueOf(val)));
    }
    varMatcher.appendTail(sb);
    return sb.toString();
  }
}
