<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\LeadRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/leads')]
class TransacionadoController extends AbstractController
{
    /**
     * Retorna o valor transacionado real de cada cliente credenciado,
     * buscando na API externa da Orenda pelos tokens armazenados.
     */
    #[Route('/transacionado', name: 'app_leads_transacionado', methods: ['GET'], priority: 10)]
    public function transacionado(Request $request, LeadRepository $leadRepository): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser instanceof User) {
            return $this->json(['error' => 'Unauthenticated'], Response::HTTP_UNAUTHORIZED);
        }

        // Allow admins/managers to query on behalf of specific user(s)
        $userIdsParam = $request->query->get('user_ids') ?: $request->query->get('user_id');
        
        if ($userIdsParam && in_array($currentUser->getRole(), ['admin', 'diretor', 'nacional', 'regional', 'manager'])) {
            $userIds = explode(',', $userIdsParam);
            $qb = $leadRepository->createQueryBuilder('l');
            $leads = $qb
                ->where($qb->expr()->in('l.user', ':userIds'))
                ->andWhere('l.appFunnel = 5')
                ->andWhere('l.accreditation = 1')
                ->andWhere('l.apiToken IS NOT NULL')
                ->setParameter('userIds', $userIds)
                ->getQuery()
                ->getResult();
        } else {
            $leads = $leadRepository->createQueryBuilder('l')
                ->where('l.user = :user')
                ->andWhere('l.appFunnel = 5')
                ->andWhere('l.accreditation = 1')
                ->andWhere('l.apiToken IS NOT NULL')
                ->setParameter('user', $currentUser)
                ->getQuery()
                ->getResult();
        }

        if (empty($leads)) {
            return $this->json([]);
        }

        // Build token => leadId map
        $tokenToLeadId = [];
        $codEmpresaToLeadId = [];
        $tokens = [];
        foreach ($leads as $lead) {
            $token = $lead->getApiToken();
            $apiId = $lead->getApiId();
            if ($token) {
                $tokens[] = $token;
                $tokenToLeadId[$token] = $lead->getId();
                if ($apiId) {
                    $codEmpresaToLeadId[$apiId] = $lead->getId();
                }
            }
        }

        if (empty($tokens)) {
            return $this->json([]);
        }

        // Call Orenda API using cURL
        $ch = curl_init();

        // Build url-encoded post fields for tokens array
        // Support optional date filters for historical reports
        $postFields = ['tokens' => $tokens];
        $startDate = $request->query->get('startDate');
        $endDate = $request->query->get('endDate');

        if ($startDate) {
            $postFields['data_inicio'] = $startDate;
        }
        if ($endDate) {
            $postFields['data_fim'] = $endDate;
        }
        
        $month = $request->query->get('month');
        if ($month) {
            $postFields['mes'] = $month;
        }

        $postFieldsStr = http_build_query($postFields);

        curl_setopt($ch, CURLOPT_URL, 'https://orendapay.com.br/dev04-producao/obterTransacionado.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFieldsStr);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ]);

        $rawResponse = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($curlError || $rawResponse === false) {
            return $this->json(['error' => 'Falha ao conectar com a API Orenda: ' . $curlError], Response::HTTP_BAD_GATEWAY);
        }

        $orendaData = json_decode($rawResponse, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->json(['error' => 'Resposta inválida da API Orenda', 'raw' => $rawResponse], Response::HTTP_BAD_GATEWAY);
        }

        // Map response: token => { transacionado, receitaBruta, custos, receitaLiquida }
        $result = [];

        // Handle the new 'empresas' array response format
        if (isset($orendaData['empresas']) && is_array($orendaData['empresas'])) {
            $exactMatch = (count($orendaData['empresas']) === count($tokens));
            
            foreach ($orendaData['empresas'] as $i => $empresa) {
                $leadId = null;
                $token = null;
                
                // Try matching by cod_empresa -> apiId first
                $codEmpresa = $empresa['cod_empresa'] ?? null;
                if ($codEmpresa && isset($codEmpresaToLeadId[$codEmpresa])) {
                    $leadId = $codEmpresaToLeadId[$codEmpresa];
                    // Reverse lookup token from leadId if needed
                    $token = array_search($leadId, $tokenToLeadId) ?: '';
                } 
                // Fallback to array order if it perfectly matches
                elseif ($exactMatch && isset($tokens[$i])) {
                    $token = $tokens[$i];
                    $leadId = $tokenToLeadId[$token] ?? null;
                }

                if ($leadId) {
                    $result[$leadId] = [
                        'token'          => $token,
                        'transacionado'  => $empresa['total']['transacionado'] ?? 0,
                        'receita_bruta'  => $empresa['total']['receita_bruta'] ?? 0,
                        'custos'         => $empresa['total']['custo'] ?? 0,
                        'receita_liquida'=> $empresa['total']['receita_liquida'] ?? 0,
                    ];
                }
            }
        } 
        // Fallback for the old flat object format if the API re-deploys
        elseif (is_array($orendaData) && !isset($orendaData['sucesso'])) {
            foreach ($orendaData as $token => $dados) {
                if (isset($tokenToLeadId[$token])) {
                    $leadId = $tokenToLeadId[$token];
                    $result[$leadId] = [
                        'token'          => $token,
                        'transacionado'  => $dados['transacionado'] ?? $dados['total_transacionado'] ?? 0,
                        'receita_bruta'  => $dados['receita_bruta'] ?? $dados['receitaBruta'] ?? 0,
                        'custos'         => $dados['custos'] ?? 0,
                        'receita_liquida'=> $dados['receita_liquida'] ?? $dados['receitaLiquida'] ?? 0,
                    ];
                }
            }
        }

        return $this->json($result);
    }
}
