<?php

class CredenciamentoService {
    
    private $pdo;
    private $apiUrl = "https://www.orendapay.com.br/api/v1/";
    private $apiHeaders = [];

    // Configurações de upload
    private $allowedExtensions = ['png', 'jpeg', 'jpg', 'pdf', 'PDF', 'PNG', 'JPG'];
    private $maxFileSize = 5242900; // 5MB

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
        
        // Defina os headers padrão da API aqui ou passe via construtor se variar
        // Exemplo baseados no código original:
        $this->apiHeaders = [
            "x-ID:1843",
            "x-Token:80C236395s757499R299816I8185s53u7656u72u4671u46s9714I53S4686R56O4693s28S1312C",
            "Content-Type: application/json"
        ];
    }

    /**
     * Método principal para processar o credenciamento
     */
    public function realizarCredenciamento($dados, $arquivos) {
        $codLead = $dados['cod_lead'];

        // 1. Validação de Arquivos
        $this->validarArquivos($arquivos);

        // 2. Processar Arquivos para Base64
        $arquivosBase64 = $this->processarArquivosBase64($arquivos);

        // 3. Sanitização Básica dos Dados
        $dados = $this->sanitizarDados($dados);
        
        // Formatar documento para verificar se é CPF ou CNPJ logicamente
        $docLimpo = $this->limparDocumento($dados['doc']);

        // 4. Atualizar Dados Iniciais no Banco (Update leads SET ...)
        $this->atualizarDadosIniciaisLead($codLead, $dados, $docLimpo);

        // 5. Preparar Payload para API
        $tipoPessoa = (strlen($docLimpo) == 14) ? 'PJ' : 'PF';
        $payload = $this->prepararPayload($dados, $arquivosBase64, $tipoPessoa, $codLead);

        // 6. Chamar API criarConta
        $retornoConta = $this->apiRequest('conta', 'POST', json_encode($payload));

        if ($retornoConta->codigo == 201) {
            // Sucesso na criação da conta
            $apiId = $retornoConta->retorno->ID;
            $apiToken = $retornoConta->retorno->TOKEN;

            // 7. Atualizar Lead com ID/Token da API
            $this->atualizarLeadApiInfo($codLead, $apiId, $apiToken);

            // 8. Chamar API complete (complete_pj ou complete_pf)
            $methodComplete = ($tipoPessoa == 'PJ') ? 'complete_pj' : 'complete_pf';
            
            // Atualizar headers com ID/Token retornados
            $headersCompletar = [
                "x-ID:$apiId",
                "x-Token:$apiToken",
                "Content-Type: application/json"
            ];

            $retornoComplete = $this->apiRequest($methodComplete, 'POST', json_encode($payload), $headersCompletar);

            if ($retornoComplete->codigo == 201) {
                return ['success' => true, 'message' => 'Documentos enviados para analise, acompanhe pela tela de funil'];
            } else {
                $msgErro = $retornoComplete->retorno->msg ?? 'Erro desconhecido na etapa complete';
                $this->registrarLog($codLead, "ERRO - CREDENCIAMENTO COMPLETE: $msgErro");
                throw new Exception("Erro ao completar cadastro: $msgErro");
            }

        } else {
            // Falha na criação, verificar se já existe (lógica do sistema original)
            // O sistema original verifica se já tem api_id != 0 no banco
            $leadAtual = $this->buscarLead($codLead);
            
            if ($leadAtual && $leadAtual['api_id'] != '0') {
                 // Tentar completar novamente
                 $tipoPessoa = (strlen($this->limparDocumento($leadAtual['doc'])) == 14) ? 'PJ' : 'PF';
                 $methodComplete = ($tipoPessoa == 'PJ') ? 'complete_pj' : 'complete_pf';
                 
                 $headersCompletar = [
                    "x-ID:" . $leadAtual['api_id'],
                    "x-Token:" . $leadAtual['api_token'],
                    "Content-Type: application/json"
                ];
                
                // Recriar payload se necessário ou usar o atual (usando o atual)
                $retornoComplete = $this->apiRequest($methodComplete, 'POST', json_encode($payload), $headersCompletar);

                if ($retornoComplete->codigo == 201) {
                    return ['success' => true, 'message' => 'Documentos enviados para analise (Retry)'];
                } else {
                    $msgErro = $retornoComplete->retorno->msg ?? 'Erro desconhecido';
                    $this->registrarLog($codLead, "ERRO - CREDENCIAMENTO RETRY: $msgErro");
                    throw new Exception("Erro ao tentar credenciar (Retry): $msgErro");
                }
            } else {
                $msgErro = $retornoConta->retorno->msg ?? 'Erro desconhecido';
                $this->registrarLog($codLead, "ERRO - CREDENCIAMENTO CONTA: $msgErro");
                throw new Exception("Erro ao tentar credenciar: $msgErro");
            }
        }
    }

    // --- Métodos Auxiliares ---

    private function validarArquivos($arquivos) {
        $filesToCheck = ['RG', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_ATIVIDADE', 'DOCUMENTO_CNPJ'];
        
        foreach ($filesToCheck as $key) {
            if (isset($arquivos[$key]) && $arquivos[$key]['size'] > 0) {
                 $ext = pathinfo($arquivos[$key]['name'], PATHINFO_EXTENSION);
                 if (!in_array(strtolower($ext), array_map('strtolower', $this->allowedExtensions))) {
                     throw new Exception("Arquivo $key inválido. Permitidos: png, jpg, pdf");
                 }
                 if ($arquivos[$key]['size'] >= $this->maxFileSize) {
                     throw new Exception("Arquivo $key muito grande. Máximo 5MB.");
                 }
            }
        }
    }

    private function processarArquivosBase64($arquivos) {
        $base64 = [];
        $keys = ['RG', 'COMPROVANTE_RESIDENCIA', 'COMPROVANTE_ATIVIDADE', 'DOCUMENTO_CNPJ'];
        
        foreach ($keys as $k) {
            if (isset($arquivos[$k]) && $arquivos[$k]['size'] > 0) {
                $data = file_get_contents($arquivos[$k]['tmp_name']);
                $base64[$k] = base64_encode($data);
            } else {
                $base64[$k] = null;
            }
        }
        return $base64;
    }

    private function sanitizarDados($dados) {
        $limpos = [];
        foreach ($dados as $k => $v) {
            if (is_array($v)) continue;
            // Sanitização básica (addslashes do original, strip_tags)
            $v = strip_tags($v);
            $v = trim($v);
            $limpos[$k] = $v;
        }
        return $limpos;
    }

    private function limparDocumento($doc) {
        return str_replace([".", "-", "/"], "", $doc);
    }

    private function formatarData($data) {
        // Assume formato DD/MM/YYYY ou YYYY-MM-DD para o que a API espera
        // O código original usa uma função formataData. Vamos implementar simples:
        if (strpos($data, '/') !== false) {
             // Se for DD/MM/YYYY e API espera YYYY-MM-DD? O original: formataData(..., false) -> retorna dd/mm/yyyy
             // Mas a API Zoop geralmente espera YYYY-MM-DD. Verifiquei no código original, ele apenas retorna date('d/m/Y').
             return $data; 
        }
        return $data; 
    }

    private function apiRequest($endpoint, $method, $json = null, $customHeaders = null) {
        $url = $this->apiUrl . $endpoint;
        $headers = $customHeaders ? $customHeaders : $this->apiHeaders;
        
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_TIMEOUT, 60);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_URL, $url);
        
        if ($method == 'POST') {
             curl_setopt($curl, CURLOPT_POST, 1);
             curl_setopt($curl, CURLOPT_POSTFIELDS, $json);
        } else if ($method == 'GET') {
             // Se precisar de GET
        }

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        $obj = new stdClass();
        $obj->codigo = $httpCode;
        $obj->retorno = json_decode($response);
        
        return $obj;
    }

    private function registrarLog($codLead, $msg) {
        // Implementar log no banco se necessário
        try {
            $stmt = $this->pdo->prepare("INSERT INTO log (cod_usuario, datalog, page, post, dados) VALUES (?, NOW(), ?, ?, ?)");
            $stmt->execute([$codLead, 'CredenciamentoService', '', substr($msg, 0, 1000)]);
        } catch (Exception $e) {
            // Ignorar erro de log
        }
    }

    // --- Métodos de Banco de Dados (Adapte conforme sua tabela) ---

    private function atualizarDadosIniciaisLead($codLead, $d, $docLimpo) {
        // Mapeamento baseado no UPDATE leads SET ... do código original
        $sql = "UPDATE leads SET 
            email1 = ?, doc = ?, nome_fantasia = ?, nome_responsavel = ?, doc_responsavel = ?, 
            data_abertura_empresa = ?, contato1 = ?, data_nascimento = ?, cep = ?, 
            local = ?, numero = ?, bairro = ?, cidade = ?, uf = ?, complemento = ?, 
            nome_banco = ?, tipo_conta_banco = ?, operacao = ?, agencia_banco = ?, 
            digito_agencia_banco = ?, conta_banco = ?, digito_conta_banco = ? 
            WHERE cod_lead = ?";
            
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $d['email1'], $docLimpo, $d['nome_fantasia'], $d['nome_responsavel'], $d['doc_responsavel'],
            $d['data_abertura'], $d['contato1'], $d['data_nascimento'], $d['cep'],
            $d['local'], $d['numero'], $d['bairro'], $d['cidade'], $d['uf'], $d['complemento'],
            $d['banco'], $d['conta_tipo'], $d['operacao'], $d['agencia'],
            $d['agencia_digito'], $d['conta'], $d['conta_digito'],
            $codLead
        ]);
    }

    private function atualizarLeadApiInfo($codLead, $apiId, $apiToken) {
        $stmt = $this->pdo->prepare("UPDATE leads SET api_id = ?, api_token = ? WHERE cod_lead = ?");
        $stmt->execute([$apiId, $apiToken, $codLead]);
    }

    private function buscarLead($codLead) {
        $stmt = $this->pdo->prepare("SELECT * FROM leads WHERE cod_lead = ? LIMIT 1");
        $stmt->execute([$codLead]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // --- Preparação do Payload JSON ---

    private function prepararPayload($d, $files, $tipo, $codLead) {
        $lead = $this->buscarLead($codLead); // Buscar dados frescos ou extras como modelo_recebimento
        
        $obj = new stdClass();
        
        // Dados comuns
        $obj->email = $d['email1'];
        $obj->phone_number = $d['contato1'];
        $obj->statement_descriptor = $d['nome_fantasia'];
        
        // Endereço
        $obj->line1 = $d['local'];
        $obj->line2 = $d['complemento'];
        $obj->line3 = $d['numero'];
        $obj->city = $d['cidade'];
        $obj->neighborhood = $d['bairro'];
        $obj->state = $d['uf'];
        $obj->postal_code = $d['cep'];

        // Dados Bancários
        $obj->banco = $d['banco'];
        $obj->agencia = $d['agencia'];
        $obj->agencia_digito = $d['agencia_digito'];
        $obj->conta_tipo = $d['conta_tipo'];
        $obj->conta = $d['conta'];
        $obj->conta_digito = $d['conta_digito'];
        $obj->operacao = $d['operacao'];

        // Configurações da Máquina (Baseado no Lead)
        $obj->maq_d0 = ($lead['modelo_recebimento'] == 'D0 MAQ') ? '1' : '0';
        $obj->maq_d1 = ($lead['modelo_recebimento'] == 'D1 MAQ') ? '1' : '0';
        $obj->online_d1 = ($lead['modelo_recebimento'] == 'D1') ? '1' : '0';

        if ($tipo == 'PJ') {
            $obj->business_name = $d['nome1']; // Nome da empresa
            $obj->business_description = ''; 
            $obj->statement_descriptor = $d['nome_fantasia'];
            $obj->business_phone = $d['contato1'];
            $obj->ein = $this->limparDocumento($d['doc']);
            $obj->business_opening_date = $d['data_abertura'];
            $obj->business_email = $d['email1'];
            $obj->description = 'Diretor da Empresa';
            $obj->mcc = 250;
            
            // Dados do Dono (Owner)
            $obj->name = $d['nome_responsavel'];
            $obj->taxpayer_id = $this->limparDocumento($d['doc_responsavel']);
            $obj->birthdate = $d['data_nascimento'];
            
            // Endereço do Dono (Owner Address)
            $obj->owner_line1 = $d['local'];
            $obj->owner_line2 = $d['complemento'];
            $obj->owner_line3 = $d['numero'];
            $obj->owner_city = $d['cidade'];
            $obj->owner_neighborhood = $d['bairro'];
            $obj->owner_state = $d['uf'];
            $obj->owner_postal_code = $d['cep'];

            // Arquivos PJ
            $obj->file1 = $files['DOCUMENTO_CNPJ'];
            $obj->file2 = $files['RG'];
            $obj->file3 = $files['COMPROVANTE_RESIDENCIA'];
            $obj->file4 = $files['COMPROVANTE_ATIVIDADE'];

        } else {
            // PF
            $obj->name = $d['nome1'];
            $obj->taxpayer_id = $this->limparDocumento($d['doc']);
            $obj->birthdate = $d['data_nascimento'];
            $obj->description = 'Diretor da Empresa';
            $obj->mcc = 250;
            
            // Arquivos PF
            $obj->file1 = $files['RG'];
            $obj->file2 = $files['COMPROVANTE_RESIDENCIA'];
            $obj->file3 = $files['COMPROVANTE_ATIVIDADE'];
        }

        return $obj;
    }
}
