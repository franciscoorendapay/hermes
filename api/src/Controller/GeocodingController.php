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

    #[Route('/reverse', name: 'app_geocode_reverse', methods: ['GET'])]
    public function reverse(Request $request): JsonResponse
    {
        $lat = $request->query->get('lat');
        $lng = $request->query->get('lng');

        if (!$lat || !$lng) {
            return $this->json(['error' => 'Latitude and Longitude are required'], Response::HTTP_BAD_REQUEST);
        }

        $apiKey = $_ENV['GOOGLE_MAPS_API_KEY'] ?? $_SERVER['GOOGLE_MAPS_API_KEY'] ?? '';

        // Se tiver chave Google, tenta Google primeiro
        if (!empty($apiKey)) {
            try {
                $response = $this->client->request(
                    'GET',
                    'https://maps.googleapis.com/maps/api/geocode/json',
                    [
                        'query' => [
                            'latlng' => "$lat,$lng",
                            'key' => $apiKey,
                            'language' => 'pt-BR'
                        ]
                    ]
                );

                $data = $response->toArray();
                if (!empty($data['results'])) {
                    return $this->json([
                        'display_name' => $data['results'][0]['formatted_address'],
                        'source' => 'google'
                    ]);
                }
            } catch (\Exception $e) {
                // Silently fallback to Nominatim
            }
        }

        // Fallback para Nominatim (OSM)
        try {
            $response = $this->client->request(
                'GET',
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&accept-language=pt-br",
                [
                    'headers' => [
                        'User-Agent' => 'HermesCRM/1.0 (https://hermes.com.br; contact@hermes.com.br)'
                    ],
                    'timeout' => 5 // 5 segundos de timeout
                ]
            );

            // Não jogar exceção se o status não for 2xx, vamos ler o erro
            $statusCode = $response->getStatusCode();
            if ($statusCode !== 200) {
                return $this->json([
                    'display_name' => 'Erro na API de Endereço (Status ' . $statusCode . ')',
                    'source' => 'nominatim_error',
                    'debug' => $response->getContent(false)
                ]);
            }

            $data = $response->toArray();
            
            // Formatando o endereço de forma mais amigável se possível
            $displayName = $data['display_name'] ?? 'Endereço não identificado';
            $addressObj = $data['address'] ?? null;
            
            if ($addressObj) {
                $road = $addressObj['road'] ?? $addressObj['pedestrian'] ?? $addressObj['path'] ?? null;
                $number = $addressObj['house_number'] ?? null;
                $suburb = $addressObj['suburb'] ?? $addressObj['neighbourhood'] ?? null;
                if ($road) {
                    $displayName = $road . ($number ? ', ' . $number : '') . ($suburb ? ' - ' . $suburb : '');
                }
            }

            return $this->json([
                'display_name' => "DEBUG: $displayName",
                'source' => 'nominatim',
                'address' => $addressObj,
                'full_display_name' => $data['display_name'] ?? null
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'display_name' => 'Erro de conexão: ' . $e->getMessage(),
                'source' => 'error'
            ]);
        }
    }
}
