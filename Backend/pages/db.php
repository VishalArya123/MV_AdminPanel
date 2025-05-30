<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__FILE__) . '/debug.log');

function sendJsonResponse($data, $statusCode = 200) {
    ob_clean();
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Handle OPTIONS preflight request
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
    
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function handleError($errno, $errstr, $errfile, $errline) {
    $errorMsg = "Error [$errno]: $errstr in $errfile on line $errline";
    error_log($errorMsg);
    sendJsonResponse(['error' => $errorMsg], 500);
}

function handleException($e) {
    $errorMsg = "Exception: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString();
    error_log($errorMsg);
    sendJsonResponse(['error' => $errorMsg], 500);
}

function createRequiredDirectories() {
    $baseDir = dirname(__FILE__);
    $directories = [
        $baseDir . '/uploads',
        $baseDir . '/uploads/certificates',
        $baseDir . '/uploads/text_testimonials'
    ];
    
    foreach ($directories as $dir) {
        if (!file_exists($dir)) {
            $oldmask = umask(0);
            if (!@mkdir($dir, 0755, true)) {
                $error = error_get_last();
                error_log("Failed to create directory $dir: " . $error['message']);
                
                $parentDir = dirname($dir);
                if (!is_writable($parentDir)) {
                    error_log("Parent directory $parentDir is not writable");
                    throw new Exception("Parent directory is not writable.");
                }
            }
            umask($oldmask);
            
            if (!chmod($dir, 0755)) {
                error_log("Failed to set permissions for $dir");
                throw new Exception("Failed to set directory permissions");
            }
        }
        
        if (!is_writable($dir)) {
            error_log("Directory $dir is not writable");
            throw new Exception("Directory is not writable after creation");
        }
    }
    
    return true;
}

set_error_handler('handleError');
set_exception_handler('handleException');

// Database Connection
try {
    $conn = new mysqli('localhost', 'Sarvesh', 'Sarvesh@123', 'AdminPanel');
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');
    error_log("Database connection successful");
    
    if (createRequiredDirectories()) {
        error_log("Required directories created successfully");
    }
    
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>