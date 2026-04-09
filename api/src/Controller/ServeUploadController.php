<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ServeUploadController extends AbstractController
{
    public function __construct(private string $uploadDir) {}

    #[Route('/uploads/{filename}', name: 'app_serve_upload', methods: ['GET'], requirements: ['filename' => '.+'])]
    public function serve(string $filename): Response
    {
        // Prevent path traversal
        $filename = basename($filename);
        $filePath = rtrim($this->uploadDir, '/') . '/' . $filename;

        if (!file_exists($filePath) || !is_file($filePath)) {
            throw $this->createNotFoundException('Arquivo não encontrado.');
        }

        return new BinaryFileResponse($filePath);
    }
}
