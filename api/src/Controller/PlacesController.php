<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/api/places')]
class PlacesController extends AbstractController
{
    private string $apiKey;

    public function __construct(private HttpClientInterface $client)
    {
        $this->apiKey = $_ENV['GOOGLE_MAPS_API_KEY'] ?? $_SERVER['GOOGLE_MAPS_API_KEY'] ?? '';
    }

    #[Route('/autocomplete', name: 'api_places_autocomplete', methods: ['GET'])]
    public function autocomplete(Request $request): JsonResponse
    {
        if (empty($this->apiKey)) {
            return $this->json(['error' => 'Server API Key not configured'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $input = $request->query->get('input');
        $sessionToken = $request->query->get('sessionToken'); // Supported in new API? Yes as sessionToken

        if (!$input) {
            return $this->json([]);
        }

        try {
            // Using New Places API (v1)
            // https://places.googleapis.com/v1/places:autocomplete
            $response = $this->client->request(
                'POST',
                'https://places.googleapis.com/v1/places:autocomplete',
                [
                    'headers' => [
                        'X-Goog-Api-Key' => $this->apiKey,
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'input' => $input,
                        'sessionToken' => $sessionToken,
                        //'includedPrimaryTypes' => ['establishment'], // Optional
                        'includedRegionCodes' => ['BR'],
                    ]
                ]
            );

            $data = $response->toArray();
            
            // Map predictions to a simpler format for frontend
            // New API returns 'suggestions' -> 'placePrediction'
            $predictions = [];
            foreach ($data['suggestions'] ?? [] as $suggestion) {
                if (isset($suggestion['placePrediction'])) {
                    $p = $suggestion['placePrediction'];
                    $predictions[] = [
                        'place_id' => $p['place'], // place resource name e.g. "places/ChIJ..."
                        'description' => $p['text']['text'],
                        'main_text' => $p['structuredFormat']['mainText']['text'] ?? $p['text']['text'],
                        'secondary_text' => $p['structuredFormat']['secondaryText']['text'] ?? '',
                    ];
                }
            }

            return $this->json($predictions);

        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/details', name: 'api_places_details', methods: ['GET'])]
    public function details(Request $request): JsonResponse
    {
        if (empty($this->apiKey)) {
            return $this->json(['error' => 'Server API Key not configured'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $placeId = $request->query->get('placeId');
        // New API IDs look like "places/ChIJ..." but libraries often just pass "ChIJ..."
        // Ensure "places/" prefix if missing, OR use old ID format if compatible.
        // Actually New API ID is resource name "places/ID".
        // If frontend sends "ChIJ...", we might need to prepend "places/".
        
        if (!str_starts_with($placeId, 'places/')) {
            $resourceName = 'places/' . $placeId;
        } else {
            $resourceName = $placeId;
        }

        $sessionToken = $request->query->get('sessionToken');

        try {
            // https://places.googleapis.com/v1/{name}
            $response = $this->client->request(
                'GET',
                "https://places.googleapis.com/v1/{$resourceName}",
                [
                    'headers' => [
                        'X-Goog-Api-Key' => $this->apiKey,
                        'X-Goog-FieldMask' => 'id,displayName,formattedAddress,location,addressComponents,types,nationalPhoneNumber',
                        // Session token is passed via query param in GET? No, AutocompleteSessionToken not used in DETAILS in v1?
                        // Documentation says session token is for autocomplete to details.
                        // Actually, billing is automatic.
                    ],
                    'query' => [
                       'sessionToken' => $sessionToken, // Verify if this parameter exists for GET details
                    ]
                ]
            );

            $data = $response->toArray();

            // Return raw data, frontend will map
            return $this->json($data);

        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
