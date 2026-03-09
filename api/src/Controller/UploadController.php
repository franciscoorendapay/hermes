<?php

namespace App\Controller;

use App\Service\FileUploader;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\File\UploadedFile;

#[Route('/api/upload')]
class UploadController extends AbstractController
{
    #[Route('', name: 'app_upload_file', methods: ['POST'])]
    public function upload(Request $request, FileUploader $fileUploader): JsonResponse
    {
        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');

        if (!$file) {
            return $this->json(['error' => 'No file uploaded'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $filename = $fileUploader->upload($file);
            // Assuming the folder is public/uploads, the URL would be /uploads/filename
            // The service is configured to specific folder, let's assume usage pattern.
            // Ideally we return the full relative path accessible via web.
            
            return $this->json([
                'url' => '/uploads/' . $filename,
                'filename' => $filename
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Upload failed: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
