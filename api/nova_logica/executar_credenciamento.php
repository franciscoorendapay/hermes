<?php
// Exemplo de como utilizar o módulo CredenciamentoService
// Você deve ajustar o include do arquivo e a conexão com o banco de dados.

require_once 'CredenciamentoService.php';

// Configuração de Conexão com Banco de Dados (PDO)
// Substitua pelas credenciais do seu novo sistema
$host = 'localhost';
$db   = 'comercial';
$user = 'comercial';
$pass = 'KJynzbteOFPv';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

// Instancia o Serviço
$service = new CredenciamentoService($pdo);

// Verifica se é um POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Dados do Formulário
        $dados = $_POST;
        
        // Arquivos
        $arquivos = $_FILES;

        // Executa o Credenciamento
        $resultado = $service->realizarCredenciamento($dados, $arquivos);

        if ($resultado['success']) {
            echo "<script>
                    alert('" . $resultado['message'] . "');
                    window.location.href = 'a_funil.php'; // Redirecionamento de sucesso
                  </script>";
        }

    } catch (Exception $e) {
        // Tratamento de Erro
        // logger($e->getMessage()); // Se tiver função de log
        echo "<script>
                alert('Erro: " . addslashes($e->getMessage()) . "');
                history.back();
              </script>";
    }
} else {
    echo "Método inválido.";
}
