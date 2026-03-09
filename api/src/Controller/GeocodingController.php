<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/api/geocode')]
class GeocodingController extends AbstractController
{
    public function __construct(private HttpClientInterface $client)
    {
    }

    #[Route('', name: 'app_geocode', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $address = $request->query->get('address') ?? $request->query->get('cep');
        if (!$address) {
             return $this->json(['error' => 'Address or CEP parameter is required'], Response::HTTP_BAD_REQUEST);
        }
        // Ensure you add GOOGLE_MAPS_API_KEY=your_key_here to your api/.env.local file
        $apiKey = $_ENV['GOOGLE_MAPS_API_KEY'] ?? $_SERVER['GOOGLE_MAPS_API_KEY'] ?? ''; 

        if (empty($apiKey)) {
             return $this->json(['error' => 'Server API Key not configured'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        try {
            // Google Geocoding API
            $response = $this->client->request(
                'GET',
                'https://maps.googleapis.com/maps/api/geocode/json',
                [
                    'query' => [
                        'address' => $address,
                        'components' => 'country:BR',
                        'key' => $apiKey
                    ]
                ]
            );

            $data = $response->toArray();
            
            // Return raw Google data or simplified
            return $this->json($data);

        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
