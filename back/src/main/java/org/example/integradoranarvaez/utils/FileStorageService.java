package org.example.integradoranarvaez.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    public String saveImage(MultipartFile file, String folder) throws IOException {
        log.info("==> [FileStorageService.saveImage] Guardando imagen en carpeta: {}", folder);

        String baseDir = "uploads/" + folder + "/";

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String fileName = UUID.randomUUID() + "_" + originalName;

        Path uploadPath = Paths.get(baseDir);

        if (!Files.exists(uploadPath)) {
            log.info("[FileStorageService.saveImage] Carpeta {} no existe, creando...", uploadPath);
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String url = "/uploads/" + folder + "/" + fileName;

        log.info("<== [FileStorageService.saveImage] Imagen guardada: {}", url);
        return url;
    }
}