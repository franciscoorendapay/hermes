<?php

namespace App\Service;

use App\Entity\Accreditation;
use App\Entity\Lead;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AccreditationService
{
    private EntityManagerInterface $em;
    private HttpClientInterface $httpClient;
    private LoggerInterface $logger;
    private LoggerService $loggerService;
    private string $apiUrl;
    private array $defaultHeaders;
    private \Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface $params;

    public function __construct(
        EntityManagerInterface $em,
        HttpClientInterface $httpClient,
        LoggerInterface $logger,
        LoggerService $loggerService,
        \Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface $params
    ) {
        $this->em = $em;
        $this->httpClient = $httpClient;
        $this->logger = $logger;
        $this->loggerService = $loggerService;
        $this->params = $params;
        // Adjust these as per environment configuration
        $this->apiUrl = 'https://www.orendapay.com.br/api/v1/';
        $this->defaultHeaders = [
            'x-ID' => '1843',
            'x-Token' => '80C236395s757499R299816I8185s53u7656u72u4671u46s9714I53S4686R56O4693s28S1312C',
            'Content-Type' => 'application/json'
        ];
    }

    /**
     * Submit accreditation for analysis (changes status to 'analysis')
     */
    public function submitForAnalysis(Accreditation $accreditation): void
    {
        $this->logger->info("Submitting Accreditation ID for analysis: " . $accreditation->getId());
        
        // Change status to pending (waiting for Admin)
        $accreditation->setStatus('pending');

        // Update Lead status to 'Em Análise' (9) for Commercial view
        $lead = $accreditation->getLead();
        if ($lead) {
            $lead->setAppFunnel(9);
            $this->em->persist($lead);
        }

        $this->em->persist($accreditation);
        $this->em->flush();
        
        // Log submission
        $this->loggerService->logAccreditation($accreditation, 'submitted_for_analysis', [
            'message' => 'Credenciamento enviado para análise'
        ]);
        
        $this->logger->info("Accreditation submitted for analysis successfully.");
    }


    /**
     * Approves accreditation and executes the external API flow
     */
    public function approveAndSend(Accreditation $accreditation): array
    {
        $this->logger->info("Starting approval for Accreditation ID: " . $accreditation->getId());

        try {
            $lead = $accreditation->getLead();
            
            // Validate required lead fields
            if (!$lead->getName() || !$lead->getEmail() || !$lead->getDocument()) {
                throw new \Exception("Lead possui dados incompletos. Verifique nome, email e documento.");
            }
            
            if (!$lead->getPhone()) {
                throw new \Exception("Telefone do lead é obrigatório para credenciamento.");
            }
            
            if (!$lead->getStreet() || !$lead->getCity() || !$lead->getState() || !$lead->getZipCode()) {
                throw new \Exception("Endereço completo é obrigatório (rua, cidade, estado, CEP).");
            }
            
            $filesBase64 = $this->fetchAndEncodeFiles($accreditation);
            
            $document = $this->cleanDocument($lead->getDocument());
            $type = strlen($document) === 14 ? 'PJ' : 'PF';
            
            $apiId = $lead->getApiId();
            $apiToken = $lead->getApiToken();

            // Check if we need to create account first
            if (!$apiId || !$apiToken) {
                $this->logger->info("Lead does not have API credentials. Creating account first.");
                
                // Prepare payload for POST conta
                $contaPayload = $this->preparePayload($accreditation, $lead, $filesBase64, $type);
                $this->logger->info("Sending POST conta payload: " . json_encode($contaPayload));

                // Call API createAccount (POST conta)
                $response = $this->callApi('conta', 'POST', $contaPayload);

                if ($response['code'] === 201) {
                    // Success creating account
                    // API returns flat JSON: {"ID": "...", "TOKEN": "...", ...}
                    // But check for 'retorno' wrapper just in case (legacy)
                    $body = $response['body'];
                    
                    $apiId = $body->ID ?? $body->retorno->ID ?? null;
                    $apiToken = $body->TOKEN ?? $body->retorno->TOKEN ?? null;

                    if (!$apiId || !$apiToken) {
                         $this->logger->error("Failed to extract ID/TOKEN from response: " . json_encode($body));
                         throw new \Exception("Falha ao obter credenciais da API.");
                    }

                    // Update Lead with API credentials
                    $lead->setApiId($apiId);
                    $lead->setApiToken($apiToken);
                    $this->em->persist($lead);
                    $this->em->flush(); // Flush here to save ID/TOKEN
                    
                    $this->logger->info("Account created successfully. ID: $apiId");
                } else {
                    $this->logger->error("Error in create account step. Code: " . $response['code']);
                    $msg = $response['body']->retorno->msg ?? 'Erro desconhecido ao criar conta';
                    throw new \Exception($msg);
                }
            } else {
                $this->logger->info("Lead already has API credentials. ID: $apiId. Skipping POST conta.");
            }

            // Now send complete payload
            $completePayload = $this->prepareCompletePayload($accreditation, $lead, $filesBase64, $type);
            
            // Log complete payload without files
            $logCompletePayload = $completePayload;
            unset($logCompletePayload['file1'], $logCompletePayload['file2'], $logCompletePayload['file3'], $logCompletePayload['file4']);
            $this->logger->info("Sending complete_{$type} payload (files omitted): " . json_encode($logCompletePayload));

            // Call API complete
            $methodComplete = ($type === 'PJ') ? 'complete_pj' : 'complete_pf';
            $headersComplete = $this->defaultHeaders;
            $headersComplete['x-ID'] = $apiId;
            $headersComplete['x-Token'] = $apiToken;

            $responseComplete = $this->callApi($methodComplete, 'POST', $completePayload, $headersComplete);

            if ($responseComplete['code'] === 201) {
                // Change status to 'analysis' as per business rule (waiting for operator response)
                $accreditation->setStatus('analysis');
                $this->em->persist($accreditation);
                $this->em->flush();
                
                // Log success
                $this->loggerService->logAccreditation($accreditation, 'analysis', [
                    'api_id' => $apiId,
                    'api_response_code' => 201,
                    'message' => 'Credenciamento enviado para análise'
                ]);
                
                return ['success' => true, 'message' => 'Credenciamento enviado para análise!'];
            } else {
                // Log full error response for debugging
                $this->logger->error("Error in complete step. Code: " . $responseComplete['code']);
                $this->logger->error("Full API Response: " . json_encode($responseComplete['body']));
                
                // Try to extract error message
                $msg = 'Erro desconhecido na etapa complete';
                if (isset($responseComplete['body']->retorno->msg)) {
                    $msg = $responseComplete['body']->retorno->msg;
                } elseif (isset($responseComplete['body']->message)) {
                    $msg = $responseComplete['body']->message;
                } elseif (isset($responseComplete['body']->error)) {
                    $msg = $responseComplete['body']->error;
                }
                
                $this->logger->error("Extracted error message: " . $msg);
                
                // Log error
                $this->loggerService->logAccreditation($accreditation, 'error', [
                    'error_step' => 'complete',
                    'api_response_code' => $responseComplete['code'],
                    'error_message' => $msg,
                    'response_body' => $responseComplete['body']
                ]);
                
                throw new \Exception($msg);
            }

        } catch (\Throwable $e) {
            $this->logger->error("Erro no credenciamento: " . $e->getMessage());
            $accreditation->setStatus('failed');
            $accreditation->setRejectionReason("Submission error: " . $e->getMessage());
            
            // Revert Lead status to 'Credenciamento Pendente' (7) on error
            $lead = $accreditation->getLead();
            if ($lead) {
                $lead->setAppFunnel(7);
                $this->em->persist($lead);
            }

            $this->em->persist($accreditation);
            $this->em->flush();
            
            // Log error
            $this->loggerService->logAccreditation($accreditation, 'rejected', [
                'rejection_reason' => $e->getMessage(),
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    private function fetchAndEncodeFiles(Accreditation $acc): array {
        $files = [];
        $projectDir = $this->params->get('kernel.project_dir');
        
        $map = [
            'RG' => $acc->getDocPhotoUrl(),
            'COMPROVANTE_RESIDENCIA' => $acc->getDocResidenceUrl(),
            'COMPROVANTE_ATIVIDADE' => $acc->getDocActivityUrl(),
            'DOCUMENTO_CNPJ' => $acc->getDocCnpjUrl()
        ];
        
        foreach ($map as $key => $url) {
            if ($url) {
                try {
                    // Resolve path
                    $path = $url;
                    if (str_starts_with($url, '/uploads/')) {
                         // Local file in public/uploads
                         $path = $projectDir . '/public' . $url;
                    } elseif (str_starts_with($url, '/')) {
                        // Other local path?
                        $path = $projectDir . '/public' . $url;
                    }

                    if (file_exists($path)) {
                        $this->logger->info("Resolving file resolution for $key. Path: $path");
                        $content = file_get_contents($path);
                        if ($content !== false) {
                            $files[$key] = base64_encode($content);
                        } else {
                             $this->logger->error("Failed to read file: $path");
                             $files[$key] = null;
                        }
                    } else {
                        // Fallback: try as URL if it's http
                        if (str_starts_with($url, 'http')) {
                             $content = @file_get_contents($url);
                             if ($content !== false) {
                                 $files[$key] = base64_encode($content);
                             } else {
                                  $this->logger->error("Failed to fetch URL: $url");
                                  $files[$key] = null;
                             }
                        } else {
                             $this->logger->error("File not found: $path (Original URL: $url)");
                             $files[$key] = null;
                        }
                    }
                } catch (\Throwable $e) {
                    $this->logger->warning("Could not fetch file $url: " . $e->getMessage());
                    $files[$key] = null;
                }
            } else {
                $files[$key] = null;
            }
        }
        return $files;
    }

    private function cleanDocument($doc) {
        return preg_replace('/[^0-9]/', '', $doc);
    }

    private function formatPhone($phone) {
        // Clean phone first
        $cleaned = $this->cleanDocument($phone);
        
        // Format as (99) 99999-9999 or (99) 9999-9999
        if (strlen($cleaned) === 11) {
            // Cell phone: (99) 99999-9999
            return '(' . substr($cleaned, 0, 2) . ') ' . substr($cleaned, 2, 5) . '-' . substr($cleaned, 7);
        } elseif (strlen($cleaned) === 10) {
            // Landline: (99) 9999-9999
            return '(' . substr($cleaned, 0, 2) . ') ' . substr($cleaned, 2, 4) . '-' . substr($cleaned, 6);
        }
        
        return $phone; // Return as-is if format doesn't match
    }

    private function formatCep($cep) {
        // Clean CEP first
        $cleaned = $this->cleanDocument($cep);
        
        // Format as 73015-132
        if (strlen($cleaned) === 8) {
            return substr($cleaned, 0, 5) . '-' . substr($cleaned, 5);
        }
        
        return $cep; // Return as-is if format doesn't match
    }

    private function preparePayload(Accreditation $acc, Lead $lead, array $files, string $type) {
        // Prepare address string
        $endereco = $lead->getStreet();
        if ($lead->getNumber()) {
            $endereco .= ', ' . $lead->getNumber();
        }

        // Basic payload for POST conta
        $payload = [
            'nome' => $lead->getName(), // Razão Social or Person Name
            'email' => $lead->getEmail(),
            'cpf_cnpj' => $this->cleanDocument($lead->getDocument()), // Only numbers
            'telefone' => $this->formatPhone($lead->getPhone()), // (99) 99999-9999
            'atividade' => $lead->getTradeName() ?? 'Comércio',
            'endereco' => $endereco, // "Rua principal, 988"
            'cidade' => $lead->getCity(),
            'estado' => $lead->getState(), // 2 letters
            'cep' => $this->formatCep($lead->getZipCode()), // 73015-132
        ];

        return $payload;
    }

    private function prepareCompletePayload(Accreditation $acc, Lead $lead, array $files, string $type) {
        // Validate required lead data
        if (!$lead->getZipCode()) {
            throw new \Exception("CEP é obrigatório para credenciamento.");
        }
        
        if (!$lead->getStreet() || !$lead->getCity() || !$lead->getState()) {
            throw new \Exception("Endereço completo é obrigatório (rua, cidade, estado).");
        }
        
        // Debug: Log CEP value
        $this->logger->info("CEP Value from Lead: " . ($lead->getZipCode() ?? 'NULL'));
        $this->logger->info("Formatted CEP: " . $this->formatCep($lead->getZipCode() ?? ''));
        $this->logger->info("Cleaned CEP: " . $this->cleanDocument($lead->getZipCode() ?? ''));
        
        // Validate banking data
        if (!$acc->getBankCode() || !$acc->getBankBranch() || !$acc->getBankAccount()) {
            throw new \Exception("Dados bancários incompletos. Banco, agência e conta são obrigatórios.");
        }
        
        // Common fields for both PF and PJ
        $payload = [
            'statement_descriptor' => substr($lead->getTradeName() ?? $lead->getName(), 0, 22),
            'line1' => $lead->getStreet() ?? '',
            'line2' => '', // Complemento (not captured in Lead)
            'line3' => $lead->getNumber() ?? '',
            'neighborhood' => $lead->getNeighborhood() ?? '',
            'city' => $lead->getCity() ?? '',
            'state' => $lead->getState() ?? '',
            'postal_code' => $this->cleanDocument($lead->getZipCode()), // Only numbers
            'mcc' => $lead->getMcc() ?? 250,
            
            // Banking data
            'banco' => $acc->getBankCode(),
            'agencia' => $acc->getBankBranch(),
            'agencia_digito' => $acc->getBankBranchDigit() ?? '',
            'conta_tipo' => $acc->getAccountType() ?? 'Conta Corrente',
            'conta' => $acc->getBankAccount(),
            'conta_digito' => $acc->getBankAccountDigit() ?? '',
            'operacao' => $acc->getAccountOperation() ?? '',
        ];

        if ($type === 'PF') {
            // Person Física (Individual)
            $payload['name'] = $lead->getName();
            $payload['email'] = $lead->getEmail();
            $payload['phone_number'] = $this->cleanDocument($lead->getPhone()); // Numbers only
            $payload['taxpayer_id'] = $this->cleanDocument($lead->getDocument()); // CPF
            $payload['birthdate'] = $acc->getResponsibleBirthDate() ? $acc->getResponsibleBirthDate()->format('d/m/Y') : '';
            $payload['description'] = 'Autônomo';
            
            // Files for PF
            $payload['file1'] = $files['RG']; // Documento de identidade
            $payload['file2'] = $files['COMPROVANTE_RESIDENCIA']; // Comprovante de residência
            $payload['file3'] = $files['COMPROVANTE_ATIVIDADE']; // Comprovante da atividade
        } else {
            // Pessoa Jurídica (Company)
            $payload['business_name'] = $lead->getCompanyName() ?? $lead->getName();
            $payload['business_description'] = $lead->getTradeName() ?? 'Empresa de comércio';
            $payload['business_phone'] = $this->cleanDocument($lead->getPhone());
            $payload['ein'] = $this->cleanDocument($lead->getDocument()); // CNPJ
            $payload['business_opening_date'] = $acc->getCompanyOpeningDate() ? $acc->getCompanyOpeningDate()->format('d/m/Y') : '';
            $payload['business_email'] = $lead->getEmail();
            $payload['description'] = 'Diretor da Empresa';
            
            // Responsible person data
            $payload['name'] = $acc->getResponsibleName();
            $payload['email'] = $lead->getEmail(); // Using same email
            $payload['phone_number'] = $this->cleanDocument($lead->getPhone());
            $payload['taxpayer_id'] = $this->cleanDocument($acc->getResponsibleCpf());
            $payload['birthdate'] = $acc->getResponsibleBirthDate() ? $acc->getResponsibleBirthDate()->format('d/m/Y') : '';
            
            // Owner address (using same as business)
            $payload['owner_line1'] = $lead->getStreet();
            $payload['owner_line2'] = '';
            $payload['owner_line3'] = $lead->getNumber();
            $payload['owner_neighborhood'] = $lead->getNeighborhood();
            $payload['owner_city'] = $lead->getCity();
            $payload['owner_state'] = $lead->getState();
            $payload['owner_postal_code'] = $this->cleanDocument($lead->getZipCode());
            
            // Files for PJ
            $payload['file1'] = $files['DOCUMENTO_CNPJ']; // Cartão CNPJ
            $payload['file2'] = $files['RG']; // RG/CPF do responsável
            $payload['file3'] = $files['COMPROVANTE_RESIDENCIA']; // Comprovante de residência
            $payload['file4'] = $files['COMPROVANTE_ATIVIDADE']; // Comprovante da atividade
        }

        return $payload;
    }

    private function prepareFiles(array $files)
    {
        $preparedFiles = [];
        foreach ($files as $key => $file) {
            if ($file instanceof UploadedFile) {
                // Resize and compress image before encoding
                $resizedContent = $this->resizeImage($file);
                
                // Get file extension
                $extension = $file->guessExtension() ?? 'jpg';
                if ($extension === 'jpeg') $extension = 'jpg';
                
                // Create data URI
                $base64 = base64_encode($resizedContent);
                $preparedFiles[$key] = "data:image/$extension;base64,$base64";
                
                $this->logger->info("File $key processed. Original size: " . $file->getSize() . ", Compressed size: " . strlen($resizedContent));
            }
        }
        return $preparedFiles;
    }

    private function resizeImage(UploadedFile $file, int $maxDim = 1024, int $quality = 70): string
    {
        $sourcePath = $file->getPathname();
        $this->logger->info("Attempting to resize image: " . $sourcePath . ", Original Size: " . $file->getSize());
        
        // Check if file is an image
        try {
            $imageInfo = @getimagesize($sourcePath);
        } catch (\Throwable $e) {
            $this->logger->error("Error getting image size: " . $e->getMessage());
            return file_get_contents($sourcePath);
        }

        if (!$imageInfo) {
            $this->logger->warning("File is not a valid image or getimagesize failed.");
            return file_get_contents($sourcePath);
        }

        list($width, $height, $type) = $imageInfo;
        $this->logger->info("Image dimensions: {$width}x{$height}, Type: $type");

        // Calculate new dimensions
        if ($width > $maxDim || $height > $maxDim) {
            $ratio = $width / $height;
            if ($ratio > 1) {
                $newWidth = $maxDim;
                $newHeight = (int) ($maxDim / $ratio);
            } else {
                $newHeight = $maxDim;
                $newWidth = (int) ($maxDim * $ratio);
            }
            $this->logger->info("Resizing to: {$newWidth}x{$newHeight}");
        } else {
            $newWidth = $width;
            $newHeight = $height;
            $this->logger->info("Image smaller than max dimensions, just compressing.");
        }

        // Create new image
        $dst = imagecreatetruecolor($newWidth, $newHeight);
        
        $src = null;
        switch ($type) {
            case IMAGETYPE_JPEG:
                $src = @imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $src = @imagecreatefrompng($sourcePath);
                // Maintain transparency for PNG
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                break;
            case IMAGETYPE_GIF:
                $src = @imagecreatefromgif($sourcePath);
                break;
            default:
                $this->logger->warning("Unsupported image type for resizing: $type");
                return file_get_contents($sourcePath);
        }

        if (!$src) {
            $this->logger->error("Failed to create image resource from file.");
            imagedestroy($dst);
            return file_get_contents($sourcePath);
        }

        // Resize
        if (!imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height)) {
             $this->logger->error("imagecopyresampled failed.");
        }

        // Output to buffer
        ob_start();
        if ($type === IMAGETYPE_PNG) {
            imagepng($dst, null, 8); // Compression level 0-9
        } else {
            imagejpeg($dst, null, $quality); // Quality 0-100
        }
        $content = ob_get_contents();
        ob_end_clean();

        // Free memory
        imagedestroy($src);
        imagedestroy($dst);
        
        $this->logger->info("Resize completed. New size: " . strlen($content));

        return $content;
    }

    private function callApi($endpoint, $method, $data, $headers = null)
    {
        // Increase memory limit for large payloads
        ini_set('memory_limit', '512M');
        
        $url = $this->apiUrl . $endpoint;
        $headers = $headers ?? $this->defaultHeaders;

        // Create a copy of data for logging to avoid modifying the original
        $logData = $data;
        
        // Truncate large fields (files) for logging
        foreach ($logData as $key => &$value) {
            if (is_string($value) && strlen($value) > 100) {
                // Check if it looks like a base64 image
                if (strpos($value, 'data:image') === 0) {
                    $value = substr($value, 0, 50) . '... [content truncated, total length: ' . strlen($value) . ']';
                }
            }
        }
        
        $this->logger->info("Sending payload to $endpoint: " . json_encode($logData));

        try {
            $response = $this->httpClient->request($method, $url, [
                'headers' => $headers,
                'json' => $data,
                'timeout' => 120 // Increased timeout for uploads
            ]);
            
            $content = $response->getContent(false);
            
            // Truncate response log if too long to avoid clutter
            $logContent = strlen($content) > 1000 ? substr($content, 0, 1000) . '... (truncated)' : $content;
            $this->logger->info("API Response from $endpoint: " . $logContent);

            return [
                'code' => $response->getStatusCode(),
                'body' => json_decode($content)
            ];
        } catch (\Throwable $e) {
            $this->logger->error("API Request Error: " . $e->getMessage());
            throw $e;
        }
    }

    public function checkAccreditationStatus(Accreditation $accreditation): string
    {
        $lead = $accreditation->getLead();
        $apiId = $lead->getApiId();
        $apiToken = $lead->getApiToken();

        if (!$apiId || !$apiToken) {
            $this->logger->warning("Lead {$lead->getId()} has no API credentials. Cannot check status.");
            return 'no_credentials';
        }

        // Determine if PJ or PF based on document length
        $document = $this->cleanDocument($lead->getDocument());
        $type = strlen($document) === 14 ? 'PJ' : 'PF';
        
        $endpoint = ($type === 'PJ') ? 'complete_pj' : 'complete_pf';
        
        $headers = $this->defaultHeaders;
        $headers['x-ID'] = $apiId;
        $headers['x-Token'] = $apiToken;

        $this->logger->info("Checking status for Accreditation {$accreditation->getId()} (Lead {$lead->getName()}) via $endpoint");

        try {
            // Using GET as requested
            $response = $this->httpClient->request('GET', $this->apiUrl . $endpoint, [
                'headers' => $headers,
                'timeout' => 30
            ]);

            $content = $response->getContent(false);
            $statusCode = $response->getStatusCode();
            $body = json_decode($content);

            $this->logger->info("Status check response for Lead {$lead->getId()}: Code $statusCode, Body: " . substr($content, 0, 500));

            if ($statusCode === 200 || $statusCode === 201) {
                // Check status in response
                $status = $body->status ?? null;
                $msg = $body->msg ?? null;

                if ($status === 'Ativa') {
                    if ($accreditation->getStatus() !== 'active') {
                        $accreditation->setStatus('active');
                        $accreditation->setRejectionReason(null); // Clear rejection if any
                        
                        // Update Lead logic
                        // Funnel 5 = Credenciado
                        $lead->setAppFunnel(5);
                        $lead->setAccreditation(1);
                        $this->em->persist($lead);

                        $this->em->persist($accreditation);
                        $this->em->flush();
                        
                        $this->loggerService->logAccreditation($accreditation, 'status_change', [
                            'old_status' => 'approved', 
                            'new_status' => 'active',
                            'message' => 'Conta ativada na operadora'
                        ]);
                    }
                    return 'active';
                } elseif ($status === 'Rejeitada') {
                    if ($accreditation->getStatus() !== 'rejected') {
                        $accreditation->setStatus('rejected');
                        $accreditation->setRejectionReason($msg);
                        
                        // Update Lead logic
                        // Funnel 7 = Cred. Pendente (User needs to fix/retry) or 9 (Analysis) to show rejection?
                        // Let's move to 7 so they know action is needed
                        $lead->setAppFunnel(7);
                        $this->em->persist($lead);

                        $this->em->persist($accreditation);
                        $this->em->flush();

                        $this->loggerService->logAccreditation($accreditation, 'rejected', [
                            'rejection_reason' => $msg,
                            'source' => 'check_status_cron'
                        ]);
                    }
                    return 'rejected';
                } elseif ($status === 'Pendente') {
                    return 'pending';
                } else {
                    $this->logger->warning("Unknown status received: " . ($status ?? 'null'));
                    return 'unknown';
                }

            } else {
                $this->logger->error("Status check failed with code $statusCode");
                return 'error';
            }

        } catch (\Throwable $e) {
            $this->logger->error("Exception checking status: " . $e->getMessage());
            return 'error';
        }
    }
}
