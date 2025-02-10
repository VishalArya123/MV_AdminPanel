<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__FILE__) . '/debug.log');

function sendJsonResponse($data, $statusCode = 200) {
    ob_clean();
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function handleError($errno, $errstr, $errfile, $errline) {
    $errorMsg = "Error [$errno]: $errstr in $errfile on line $errline";
    error_log($errorMsg);
    
    // Additional diagnostic information
    $diagnostics = [
        'current_user' => get_current_user(),
        'script_owner' => function_exists('posix_getpwuid') ? 
            (posix_getpwuid(fileowner(__FILE__))['name'] ?? 'Unknown') : 'POSIX not available',
        'directory_permissions' => substr(sprintf('%o', fileperms(dirname(__FILE__))), -4)
    ];
    
    sendJsonResponse([
        'error' => $errorMsg,
        'diagnostics' => $diagnostics
    ], 500);
}

function handleException($e) {
    $errorMsg = "Exception: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString();
    error_log($errorMsg);
    sendJsonResponse(['error' => $errorMsg], 500);
}

function ensureDirectoryExists($dir) {
    if (!file_exists($dir)) {
        try {
            // Create directory with minimal permissions
            if (!mkdir($dir, 0755, true)) {
                throw new Exception("Failed to create directory: $dir");
            }
        } catch (Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }
    
    // Simple writability check
    if (!is_writable($dir)) {
        error_log("Directory not writable: $dir");
        return false;
    }
    
    return true;
}

function createRequiredDirectories() {
    $baseDir = dirname(__DIR__); // Go up one directory from 'pages'
    $directories = [
        $baseDir . '/uploads',
        $baseDir . '/uploads/certificates',
        $baseDir . '/uploads/text_testimonials',
    ];

    foreach ($directories as $dir) {
        // Check if directory exists first
        if (!file_exists($dir)) {
            // Use absolute path and full permissions
            $fullPath = realpath($baseDir) . '/' . basename($dir);
            
            // Attempt to create with explicit full permissions
            if (!mkdir($fullPath, 0777, true)) {
                error_log("Failed to create directory: $fullPath");
                throw new Exception("Failed to create directory: $fullPath");
            }
        }

        // Additional writability check
        if (!is_writable($dir)) {
            error_log("Directory not writable: $dir");
            throw new Exception("Directory not writable: $dir");
        }
    }
    
    return true;
}

set_error_handler('handleError');
set_exception_handler('handleException');

// Test database connection and create required directories
try {
    $conn = new mysqli('localhost', 'root', '', 'AdminPanel');
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $conn->set_charset('utf8mb4');
    error_log("Database connection successful");
    
    // Create required directories after successful database connection
    if (createRequiredDirectories()) {
        error_log("Required directories created successfully");
    }
    
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>