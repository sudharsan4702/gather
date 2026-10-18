package com.catane.gather;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class GatherApplication {

	public static void main(String[] args) {
		loadDotEnv();
		SpringApplication.run(GatherApplication.class, args);
	}

	/**
	 * Automatically reads key-value pairs from .env into System properties if present,
	 * ensuring seamless local development without external dependencies.
	 */
	private static void loadDotEnv() {
		File[] candidates = new File[] {
			new File(".env"),
			new File("backend/.env"),
			new File("../.env")
		};

		for (File file : candidates) {
			if (file.exists() && file.isFile()) {
				try {
					List<String> lines = Files.readAllLines(file.toPath());
					for (String rawLine : lines) {
						String line = rawLine.trim();
						if (line.isEmpty() || line.startsWith("#")) {
							continue;
						}
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String value = line.substring(eqIdx + 1).trim();
							if ((value.startsWith("\"") && value.endsWith("\"")) ||
								(value.startsWith("'") && value.endsWith("'"))) {
								value = value.substring(1, value.length() - 1);
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
					System.out.println("[Catane Gather] Loaded environment variables from: " + file.getAbsolutePath());
					break;
				} catch (IOException e) {
					System.err.println("[Catane Gather] Notice: Could not read .env: " + e.getMessage());
				}
			}
		}
	}

}

